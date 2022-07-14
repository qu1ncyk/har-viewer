# har-viewer
Displays the contents of a `.har` file as a webpage.

## What's a `.har` file?
HAR stands for *HTTP Archive* and contains a list of HTTP requests and
responses in JSON format. You can create one in your browser's devtools under
the network tab. Note that [Chrome can't save the contents of multiple webpages,
even if you enable *Preserve log*](https://stackoverflow.com/questions/38924798).

## How does it work?
Just create a `.har` file and upload it on the homepage. The file will be saved
in IndexedDB databases in your browser in a different format. Now you can view the
`.har` file as a collection of webpages, served by the service worker. The service
worker looks for the best matching URL and responds with the corresponding page.
Those web pages need to have the URLs they contain rewritten in order to correctly
view their contents. HTML and CSS files are sent back to the browser thread,
because it has access to DOM and CSSOM APIs. JavaScript is primarily rewritten by
[Wombat](https://github.com/webrecorder/wombat).

## Building
Run
```sh
npm run dev
```
for a development server or
```sh
npm run build
```
to compile the project to the `dist` directory.
