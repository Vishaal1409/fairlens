#!/bin/bash
echo "Restoring source index.html..."
cat > index.html << 'HTML'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/fairlens/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FairLens — AI Fairness Audit</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
HTML
echo "Building..."
npm run build
echo "Copying assets..."
rm -rf assets/
cp -r dist/assets ./assets
cp dist/index.html ./index.html
echo "Done! Now run: git add . && git commit -m 'your message' && git push origin main"
