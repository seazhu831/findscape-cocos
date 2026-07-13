# Findscape AssetDB Bootstrap

This project extension works around a Cocos Creator 3.8.8 startup race observed on
macOS: the project AssetDB can begin its first scan before the built-in
`engine-extends` asset handlers are registered. In that state, Creator rewrites
PNG, TypeScript, JSON, text, and directory metadata with the fallback `*`
importer.

The `beforePreStart` hook waits for the built-in handler contribution and calls
the existing AssetDB manager initialization before project assets are scanned.
It does not provide or replace any importer.

Keep this extension while the project is pinned to Creator 3.8.8. Before a
Creator upgrade, test two clean launches without the extension. Remove it when
the installed Creator version consistently preserves typed asset metadata.
