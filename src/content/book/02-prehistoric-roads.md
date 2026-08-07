# Prehistoric Roads

_Replace this placeholder with your existing written chapter on prehistoric/Iron Age roads. This file demonstrates the supported Markdown conventions for the book: headings, paragraphs, blockquotes, and captioned images._

The earliest routes across the delta were not built infrastructure in the Roman sense, but well-worn paths shaped by centuries of use, following the natural high ground between wetlands and rivers.

## Inserting a QGIS map image

To insert one of your QGIS exports:

1. Save the exported PNG/JPG into `AncientDataWebGIS_FE/src/assets/book/`.
2. Reference it by filename in Markdown, using the image "title" field as the caption:

```text
\![Reconstructed Iron Age trackways](iron-age-hillforts-map.png "Reconstructed Iron Age trackway network, based on QGIS analysis of LiDAR data")
```

This renders as a captioned figure and automatically scales for mobile screens. No import statement or manual path needed — just drop the file in and reference its name (the backslash above is only there to stop this *example* from being parsed as a real image link before the file exists — omit it in your actual chapter text).

Over time, these paths began to concentrate around fordable points in the river system, anticipating much of the later Roman-period road network discussed in the next chapter.

