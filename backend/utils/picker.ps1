param([string]$InitialDirectory)

Add-Type -AssemblyName System.Windows.Forms

$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = "Select Torrent Download Directory"
$dialog.ShowNewFolderButton = $true

if ($InitialDirectory -and (Test-Path $InitialDirectory)) {
    $dialog.SelectedPath = $InitialDirectory
}

# Create a topmost owner window and activate it to force dialog in front of browser
$form = New-Object System.Windows.Forms.Form
$form.TopMost = $true
$form.Width = 1
$form.Height = 1
$form.Opacity = 0.01
$form.ShowInTaskbar = $false
$form.StartPosition = [System.Windows.Forms.FormStartPosition]::CenterScreen
$form.Show()
$form.BringToFront()
$form.Activate()

$result = $dialog.ShowDialog($form)
$form.Close()
$form.Dispose()

if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
    [Console]::Out.WriteLine($dialog.SelectedPath)
}
