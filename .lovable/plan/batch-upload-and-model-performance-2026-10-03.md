# Batch Upload and Model Performance

## Build
- Convert the top navigation to three working screens: Analyze, Batch Upload, and Model Performance; remove About.
- Keep the current vibrant Hindi–English visual language and responsive 1440px/390px layouts.
- Build Batch Upload as an interactive prototype with CSV/XLSX selection, sample download, column mapping, model selection, validation, progress, KPIs, charts, filters, expandable reviews, pagination, and CSV export.
- Build Model Performance with clearly visible dataset distribution, six-model accuracy and macro-F1 comparison, full metrics table, switchable confusion matrix, top-word chips, and a hardest-class insight.

## Data note
- Until the notebook is connected, Model Performance will use clearly labeled placeholder metrics and matrices in one data structure, ready to replace with the real results later.
- Batch Upload will parse the chosen file’s headers and rows in the browser, then generate deterministic prototype predictions rather than calling a model service.

## Technical details
- Add `/batch-upload` and `/model-performance` routes with unique metadata.
- Add shared navigation and model selector controls under the shared UI area.
- Use the existing chart library and semantic sentiment colors; CSV export will reflect the currently analyzed table.
- Verify no-file, invalid-file, processing, results, mobile layout, chart visibility, filtering, expansion, pagination, and downloads.
