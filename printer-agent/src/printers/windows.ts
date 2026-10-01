import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PrintError, type PrintErrorCode, type PrinterDriver, type PrinterInfo } from './types.ts';

/**
 * Impressora instalada no Windows. Os bytes ESC/POS vão em modo RAW pelo spooler
 * (winspool.drv), usando o driver que já veio com a impressora: não precisa trocar
 * driver (Zadig/libusb) nem compilar módulo nativo, e o .exe fica com um arquivo só.
 */

const LIST_SCRIPT = String.raw`
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$cim = @{}
foreach ($c in @(Get-CimInstance -ClassName Win32_Printer)) { $cim[$c.Name] = $c }
$list = @(foreach ($p in @(Get-Printer)) {
  $c = $cim[$p.Name]
  [pscustomobject]@{
    name = [string]$p.Name
    driver = [string]$p.DriverName
    port = [string]$p.PortName
    status = [string]$p.PrinterStatus
    workOffline = [bool]($c -and $c.WorkOffline)
    errorState = [int]$(if ($c) { $c.DetectedErrorState } else { 0 })
    isDefault = [bool]($c -and $c.Default)
  }
})
ConvertTo-Json -InputObject $list -Compress
`;

const RAW_PRINTER_CSHARP = String.raw`
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;

public static class SosRawPrinter {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public class DOC_INFO_1 {
    public string pDocName;
    public string pOutputFile;
    public string pDatatype;
  }

  [DllImport("winspool.drv", EntryPoint = "OpenPrinterW", SetLastError = true, CharSet = CharSet.Unicode)]
  static extern bool OpenPrinter(string name, out IntPtr handle, IntPtr defaults);
  [DllImport("winspool.drv", SetLastError = true)]
  static extern bool ClosePrinter(IntPtr handle);
  [DllImport("winspool.drv", EntryPoint = "StartDocPrinterW", SetLastError = true, CharSet = CharSet.Unicode)]
  static extern int StartDocPrinter(IntPtr handle, int level, [In, MarshalAs(UnmanagedType.LPStruct)] DOC_INFO_1 info);
  [DllImport("winspool.drv", SetLastError = true)]
  static extern bool EndDocPrinter(IntPtr handle);
  [DllImport("winspool.drv", SetLastError = true)]
  static extern bool StartPagePrinter(IntPtr handle);
  [DllImport("winspool.drv", SetLastError = true)]
  static extern bool EndPagePrinter(IntPtr handle);
  [DllImport("winspool.drv", SetLastError = true)]
  static extern bool WritePrinter(IntPtr handle, byte[] data, int count, out int written);

  public static int Send(string printer, string documentName, byte[] data) {
    IntPtr handle;
    if (!OpenPrinter(printer, out handle, IntPtr.Zero)) throw new Win32Exception(Marshal.GetLastWin32Error());
    try {
      DOC_INFO_1 info = new DOC_INFO_1();
      info.pDocName = documentName;
      info.pDatatype = "RAW";
      int job = StartDocPrinter(handle, 1, info);
      if (job == 0) throw new Win32Exception(Marshal.GetLastWin32Error());
      try {
        if (!StartPagePrinter(handle)) throw new Win32Exception(Marshal.GetLastWin32Error());
        int written;
        bool ok = WritePrinter(handle, data, data.Length, out written);
        int error = ok ? 0 : Marshal.GetLastWin32Error();
        EndPagePrinter(handle);
        if (!ok) throw new Win32Exception(error);
        if (written != data.Length) throw new Win32Exception(0, "A impressora recebeu so parte dos dados.");
      } finally {
        EndDocPrinter(handle);
      }
      return job;
    } finally {
      ClosePrinter(handle);
    }
  }
}
`;

// Parâmetros chegam por variável de ambiente: nada do pedido é colado dentro do script.
const PRINT_SCRIPT = String.raw`
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
function Out-Result($data) { ConvertTo-Json -InputObject ([pscustomobject]$data) -Compress; exit 0 }
$printer = $env:SOS_PRINTER
$timeoutMs = [int]$env:SOS_TIMEOUT_MS
try {
  Add-Type -TypeDefinition $env:SOS_CSHARP
} catch {
  Out-Result @{ ok = $false; code = 'SPOOLER_ERROR'; message = "Falha ao preparar o envio: $($_.Exception.Message)" }
}
try {
  $bytes = [System.IO.File]::ReadAllBytes($env:SOS_FILE)
  $job = [SosRawPrinter]::Send($printer, $env:SOS_DOC, $bytes)
} catch {
  $ex = $_.Exception
  while ($ex.InnerException) { $ex = $ex.InnerException }
  $native = 0
  if ($ex -is [System.ComponentModel.Win32Exception]) { $native = $ex.NativeErrorCode }
  $code = switch ($native) { 1801 { 'PRINTER_NOT_FOUND' } 1804 { 'DRIVER_ERROR' } default { 'SPOOLER_ERROR' } }
  Out-Result @{ ok = $false; code = $code; message = $ex.Message; native = $native }
}
$deadline = [DateTime]::UtcNow.AddMilliseconds($timeoutMs)
$last = ''
while ([DateTime]::UtcNow -lt $deadline) {
  $j = Get-PrintJob -PrinterName $printer -ID $job -ErrorAction SilentlyContinue
  if (-not $j) { Out-Result @{ ok = $true; jobId = $job } }
  $last = [string]$j.JobStatus
  if ($last -match 'Printed|Complete') { Out-Result @{ ok = $true; jobId = $job } }
  Start-Sleep -Milliseconds 300
}
# Não saiu no tempo: tira da fila, senão ela imprime sozinha quando a impressora
# voltar e, somada ao "Tentar novamente", a cozinha recebe duas comandas.
$removed = $true
try { Remove-PrintJob -PrinterName $printer -ID $job -ErrorAction Stop } catch { $removed = $false }
$p = Get-Printer -Name $printer -ErrorAction SilentlyContinue
Out-Result @{ ok = $false; code = 'PRINT_TIMEOUT'; jobId = $job; jobStatus = $last; printerStatus = [string]$p.PrinterStatus; removed = $removed }
`;

interface RawPrinter {
  name: string;
  driver: string;
  port: string;
  status: string;
  workOffline: boolean;
  errorState: number;
  isDefault: boolean;
}

interface PrintScriptResult {
  ok: boolean;
  code?: PrintErrorCode;
  message?: string;
  jobStatus?: string;
  printerStatus?: string;
  removed?: boolean;
}

/** Status do Windows (Get-Printer / Win32_Printer) → motivo que o painel mostra. */
export function problemFromStatus(status: string, workOffline = false, errorState = 0): PrintErrorCode | null {
  if (/PaperOut|PaperProblem/i.test(status) || errorState === 4) return 'PAPER_OUT';
  if (/Offline|NotAvailable/i.test(status) || workOffline || errorState === 9) return 'PRINTER_OFFLINE';
  if (/Paused/i.test(status)) return 'PRINTER_PAUSED';
  if (/Error|PaperJam|DoorOpen|UserIntervention/i.test(status) || errorState === 7 || errorState === 8) {
    return 'PRINTER_ERROR';
  }
  return null;
}

function runPowerShell(script: string, env: Record<string, string>, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const encoded = Buffer.from(script, 'utf16le').toString('base64');
    const child = spawn(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded],
      { env: { ...process.env, ...env }, windowsHide: true },
    );
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new PrintError('SPOOLER_ERROR', 'O Windows demorou demais para responder.'));
    }, timeoutMs);
    child.stdout.setEncoding('utf8').on('data', (chunk: string) => (stdout += chunk));
    child.stderr.setEncoding('utf8').on('data', (chunk: string) => (stderr += chunk));
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(new PrintError('SPOOLER_ERROR', `Não foi possível abrir o PowerShell: ${error.message}`));
    });
    child.on('close', () => {
      clearTimeout(timer);
      const lastLine = stdout.trim().split(/\r?\n/).pop() ?? '';
      if (lastLine.startsWith('{') || lastLine.startsWith('[')) resolve(lastLine);
      else reject(new PrintError('SPOOLER_ERROR', (stderr.trim() || stdout.trim() || 'Resposta vazia do Windows').slice(0, 200)));
    });
  });
}

export class WindowsPrinterDriver implements PrinterDriver {
  readonly simulated = false;

  async list(): Promise<PrinterInfo[]> {
    const output = await runPowerShell(LIST_SCRIPT, {}, 20_000);
    const raw = JSON.parse(output) as RawPrinter[] | RawPrinter;
    return (Array.isArray(raw) ? raw : [raw]).map((printer) => {
      const problem = problemFromStatus(printer.status, printer.workOffline, printer.errorState);
      return {
        name: printer.name,
        driver: printer.driver,
        port: printer.port,
        isDefault: printer.isDefault,
        status: printer.workOffline ? `${printer.status} (usar offline)` : printer.status,
        ready: problem === null,
        problem,
      };
    });
  }

  async print(printerName: string, data: Buffer, documentName: string, timeoutMs: number): Promise<void> {
    const file = join(tmpdir(), `sos-impressora-${randomUUID()}.bin`);
    await writeFile(file, data);
    try {
      const output = await runPowerShell(
        PRINT_SCRIPT,
        {
          SOS_PRINTER: printerName,
          SOS_FILE: file,
          SOS_DOC: documentName,
          SOS_TIMEOUT_MS: String(timeoutMs),
          SOS_CSHARP: RAW_PRINTER_CSHARP,
        },
        timeoutMs + 30_000,
      );
      const result = JSON.parse(output) as PrintScriptResult;
      if (result.ok) return;
      if (result.code === 'PRINT_TIMEOUT') {
        const problem =
          problemFromStatus(result.printerStatus ?? '') ?? problemFromStatus(result.jobStatus ?? '') ?? 'PRINT_TIMEOUT';
        const warning = result.removed === false ? ' Confira a fila de impressão do Windows antes de tentar de novo.' : '';
        throw new PrintError(problem, `${new PrintError(problem).message}${warning}`);
      }
      const code = result.code ?? 'SPOOLER_ERROR';
      throw new PrintError(code, code === 'SPOOLER_ERROR' && result.message ? `Erro do Windows: ${result.message}` : undefined);
    } finally {
      await rm(file, { force: true });
    }
  }
}
