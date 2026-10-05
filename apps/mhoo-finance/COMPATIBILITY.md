# Phase A compatibility boundary

This App intentionally relies only on the current Twenty App manifest,
standalone page, native object/view, and front-component APIs. Its front
component uses the public `twenty-ui` package rather than a private dashboard
design system.

The published `twenty-ui@1.0.0-alpha.1` package does not expose every component
available in the main Twenty source tree. In particular, it does not export the
newer segmented-control or general Text components. The preview therefore uses
the package's supported ButtonGroup and Label primitives while retaining Twenty
Cards, status tags, callouts, headings, theme tokens, and native graph widgets.

No provider/OAuth compatibility extension is declared in this App. A future
real-source adapter must be introduced through a separately reviewed contract
and write through the same artifact, receipt, fact, coverage, exception, and
lineage model.

The closed-beta Workspace render and permission proof are not claimed here.
