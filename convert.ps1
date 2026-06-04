$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open('T:\PROJECTS\Trading_Journal\Maven_Trading_Journal_Master_Prompt.docx')
$doc.SaveAs('T:\PROJECTS\Trading_Journal\Maven_Trading_Journal_Master_Prompt.txt', 2)
$doc.Close(0)
$word.Quit(0)
Write-Host "Conversion complete"
