Option Explicit

Dim shell, fso, scriptPath, command, args, index

Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

If WScript.Arguments.Count < 1 Then
  WScript.Quit 2
End If

scriptPath = WScript.Arguments(0)
If Not fso.FileExists(scriptPath) Then
  WScript.Quit 3
End If

args = ""
For index = 1 To WScript.Arguments.Count - 1
  args = args & " " & Quote(WScript.Arguments(index))
Next

command = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File " & Quote(scriptPath) & args
shell.Run command, 0, False

Function Quote(value)
  Quote = """" & Replace(CStr(value), """", "\""") & """"
End Function
