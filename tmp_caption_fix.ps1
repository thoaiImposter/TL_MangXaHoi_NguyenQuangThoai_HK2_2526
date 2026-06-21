$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

$src = 'D:\NLU-social\22130273_NguyenQuangThoai.docx'
$work = Join-Path $env:TEMP ('docx_edit_' + [guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $work | Out-Null
[System.IO.Compression.ZipFile]::ExtractToDirectory($src, $work)

$docPath = Join-Path $work 'word\document.xml'
[xml]$doc = Get-Content -LiteralPath $docPath -Raw
$ns = New-Object System.Xml.XmlNamespaceManager($doc.NameTable)
$ns.AddNamespace('w','http://schemas.openxmlformats.org/wordprocessingml/2006/main')

$paras = @($doc.SelectNodes('//w:p', $ns))

function Set-ParaCaption {
    param(
        [System.Xml.XmlElement]$p,
        [string]$text,
        $doc,
        $ns
    )

    $wuri = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

    $pPr = $p.SelectSingleNode('./w:pPr', $ns)
    if (-not $pPr) {
        $pPr = $doc.CreateElement('w', 'pPr', $wuri)
        [void]$p.InsertBefore($pPr, $p.FirstChild)
    }

    $jc = $pPr.SelectSingleNode('./w:jc', $ns)
    if (-not $jc) {
        $jc = $doc.CreateElement('w', 'jc', $wuri)
        [void]$pPr.AppendChild($jc)
    }
    $jc.SetAttribute('val', $wuri, 'center')

    $existing = @()
    foreach ($child in $p.ChildNodes) {
        if ($child.Name -ne 'w:pPr') {
            $existing += $child
        }
    }
    foreach ($child in $existing) {
        [void]$p.RemoveChild($child)
    }

    $r = $doc.CreateElement('w', 'r', $wuri)
    $rPr = $doc.CreateElement('w', 'rPr', $wuri)
    $fonts = $doc.CreateElement('w', 'rFonts', $wuri)
    $fonts.SetAttribute('ascii', $wuri, 'Times New Roman')
    $fonts.SetAttribute('hAnsi', $wuri, 'Times New Roman')
    $fonts.SetAttribute('cs', $wuri, 'Times New Roman')
    $fonts.SetAttribute('eastAsia', $wuri, 'Times New Roman')
    $sz = $doc.CreateElement('w', 'sz', $wuri)
    $sz.SetAttribute('val', $wuri, '24')
    $szCs = $doc.CreateElement('w', 'szCs', $wuri)
    $szCs.SetAttribute('val', $wuri, '24')
    [void]$rPr.AppendChild($fonts)
    [void]$rPr.AppendChild($sz)
    [void]$rPr.AppendChild($szCs)
    [void]$r.AppendChild($rPr)
    $t = $doc.CreateElement('w', 't', $wuri)
    $t.SetAttribute('space', 'http://www.w3.org/XML/1998/namespace', 'preserve')
    $t.InnerText = $text
    [void]$r.AppendChild($t)
    [void]$p.AppendChild($r)
}

$targets = @(
    @{ Index = 709;  Text = 'Ảnh 1: Lược đồ kiến trúc hệ thống' },
    @{ Index = 715;  Text = 'Ảnh 2: Lược đồ usecase tổng quát' },
    @{ Index = 877;  Text = 'Bảng 1: Danh sách các usecase' },
    @{ Index = 907;  Text = 'Bảng 2: Bảng quản lý khoa' },
    @{ Index = 2072; Text = 'Ảnh 3: Sơ đồ Activity chức năng Đăng nhập' },
    @{ Index = 2075; Text = 'Ảnh 4: Sơ đồ Sequence chức năng Đăng nhập' },
    @{ Index = 2107; Text = 'Bảng 3: Đặc tả chi tiết Use Case UC03 - Đăng xuất' }
)

foreach ($item in $targets) {
    Set-ParaCaption -p $paras[$item.Index] -text $item.Text -doc $doc -ns $ns
}

$doc.Save($docPath)

$out = 'D:\NLU-social\22130273_NguyenQuangThoai.docx'
if (Test-Path $out) { Remove-Item $out -Force }
[System.IO.Compression.ZipFile]::CreateFromDirectory($work, $out)

Remove-Item $work -Recurse -Force

