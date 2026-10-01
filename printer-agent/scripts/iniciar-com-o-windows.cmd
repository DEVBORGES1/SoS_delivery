@echo off
rem Cria um atalho do agente na pasta "Inicializar" do Windows (so para este usuario).
rem Assim ele abre sozinho, minimizado, sempre que o computador da loja ligar.
set "EXE=%~dp0sos-impressora.exe"
if not exist "%EXE%" (
  echo Nao achei o sos-impressora.exe nesta pasta.
  pause
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$s = (New-Object -ComObject WScript.Shell).CreateShortcut([Environment]::GetFolderPath('Startup') + '\SOS Impressora.lnk');" ^
  "$s.TargetPath = $env:EXE; $s.WorkingDirectory = [IO.Path]::GetDirectoryName($env:EXE); $s.WindowStyle = 7;" ^
  "$s.Description = 'Agente de impressao de comandas S.O.S Delivery'; $s.Save()"
if errorlevel 1 (
  echo Nao foi possivel criar o atalho.
  pause
  exit /b 1
)
echo Pronto! O agente vai abrir sozinho (minimizado) quando o Windows iniciar.
echo Para desfazer: Win+R, digite shell:startup e apague "SOS Impressora".
pause
