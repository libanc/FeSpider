(function() {
    var lastSnapshot, html, css,

        cssStringifier = new CSSStringifier(),
        shorthandPropertyFilter = new ShorthandPropertyFilter(),
        webkitPropertiesFilter = new WebkitPropertiesFilter(),
        defaultValueFilter = new DefaultValueFilter(),
        sameRulesCombiner = new SameRulesCombiner(),
        inspectedContext = new InspectedContext();

    var $hint = $('#hint'),
        $createButton = $('#create'),
        $htmlTextarea = $('#html'),
        $cssTextarea = $('#css');

    // Event listeners
    $createButton.on('click', make);
    $htmlTextarea.on('click', function() {
        $(this).select();
    });
    $cssTextarea.on('click', function() {
        $(this).select();
    });

    // Storage - get & set
    // Since we can't access localStorage from here, we need to ask background page to handle it.
    // Communication with background page is based on sendMessage/onMessage.
    function getStorage() {
        chrome.runtime.sendMessage({
            name: 'getStorage'
        }, function(storage) {
            // TODO
        });
    }

    function setStorage(data, key, value) {
        chrome.runtime.sendMessage({
            name: 'setStorage',
            data: data,
            item: key,
            value: value
        });
    }

    // processing
    function make() {
        $hint.text('please wait...');

        inspectedContext.eval("(" + Snapshooter.toString() + ")($0)", function(result) {
            try {
                lastSnapshot = JSON.parse(result);
            } catch (e) {
                $hint.text('DOM snapshot could not be created. Make sure that you have inspected some element.');
            }

            process();
        });
    }

    function process() {
        if (!lastSnapshot) {
            return;
        }

        css = lastSnapshot.css,
        html = lastSnapshot.html;

        $hint.text('processing');

        css = defaultValueFilter.process(css);
        css = shorthandPropertyFilter.process(css);
        css = webkitPropertiesFilter.process(css);
        css = sameRulesCombiner.process(css);

        html = $.htmlClean(html, {
            removeAttrs: ['class'],
            allowedAttributes: [
                ['id'],
                ['placeholder', ['input', 'textarea']],
                ['disabled', ['input', 'textarea', 'select', 'option', 'button']],
                ['value', ['input', 'button']],
                ['readonly', ['input', 'textarea', 'option']],
                ['label', ['option']],
                ['selected', ['option']],
                ['checked', ['input']]
            ],
            format: true,
            replace: [],
            replaceStyles: [],
            allowComments: true
        });

        css = cssStringifier.process(css);

        $htmlTextarea.val(html);
        $cssTextarea.val(css);

        chrome.devtools.inspectedWindow.eval(
            'document.body.innerHTML="";document.head.innerHTML=""',
            function(result, isException) {}
        );
        chrome.devtools.inspectedWindow.eval(
            // 'document.body.innerHTML=""',
            "document.body.style.cssText = '';while(document.body.attributes.length > 0) document.body.removeAttribute(document.body.attributes[0].name);var old_body = document.body;var new_body = old_body.cloneNode(true);old_body.parentNode.replaceChild(new_body, old_body); document.body.innerHTML = '<div>' + '" + html.replace(/'/g,'"').replace(/\n/g,"\\n") + "' + '</div>'",
            function(result, isException) {}
        );
	    chrome.devtools.inspectedWindow.eval(
	        'var css = "' + css.replace(/"/g,"'").replace(/\n/g,"\\n") + '",head = document.head || document.getElementsByTagName("head")[0],style = document.createElement("style");style.type = "text/css";if (style.styleSheet){style.styleSheet.cssText = css;} else {style.appendChild(document.createTextNode(css));}head.appendChild(style);',
	        function(result, isException) {}
	    );

        $hint.text('');
    }
})();