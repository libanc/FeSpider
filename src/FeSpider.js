/**
 * @Author: Ke Shen <godzilla>
 * @Date:   2017-03-10 09:43:57
 * @Email:  keshen@sohu-inc.com
 * @Last modified by:   godzilla
 * @Last modified time: 2017-03-10 09:43:57
 */

(function () {

    var conf = {
        fetchFont: false,
        serverHost: 'http://127.0.0.1:3663'
    };

    /**
     * String Hash
     * Ref: http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
     */
    String.prototype.hashCode = function () {
        var hash = 0, i, chr;
        if (this.length === 0) return hash;
        for (i = 0; i < this.length; i++) {
            chr   = this.charCodeAt(i);
            hash  = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    };
    
    if (!String.prototype.endsWith) {
        String.prototype.endsWith = function (s) {
            if (typeof s !== 'string') return false;
            if (s.length > this.length) return false;
            return (this.substr(this.length - s.length) === s);
        };
    }
    
    var parseUrl = function (url) {
        var parser = document.createElement('a');
        parser.href = url;
        return {
            protocol: parser.protocol,
            host: parser.host,
            path: parser.pathname,
            search: parser.search,
            hash: parser.hash
        };
    };
    var recoverUrl = function (base, target) {
        if (target.startsWith('http://') || target.startsWith('https://') || target.startsWith('data:')) return target;
        base = recoverUrl(window.location.href, base);
        var b = parseUrl(base);
        if (target.startsWith('//')) return b.protocol + target;
        if (target.startsWith('/')) return b.protocol + '//' + b.host + target;
        if (b.path.endsWith('/')) return b.protocol + '//' + b.host + b.path + target;
        return b.protocol + '//' + b.host + b.path.substring(0, b.path.lastIndexOf('/')) + '/' + target;
    };
    var recoverCssUrls = function (cssText, baseUrl) {
        var replacer = function (s, p1) {
            var inner = p1;
            if (p1.charAt(1) === "'" && p1.charAt(p1.length - 2) === "'") inner = p1.substr(2, p1.length - 4);
            else if (p1.charAt(1) === '"' && p1.charAt(p1.length - 2) === '"') inner = p1.substr(2, p1.length - 4);
            else inner = p1.substr(1, p1.length - 2);
            if (inner.startsWith('data:')) return 'url(' + inner + ')';
            return 'url(\'' + recoverUrl(baseUrl, inner) + '\')';
        };
        cssText = cssText.replace(/url\s*\((.*?)\)/g, replacer);
        return cssText;
    };

    var getCssLinks = function () {
        var sheet = document.styleSheets,
            i = sheet.length;
        var re = [];
        while (0 <= --i) {
            if (sheet[i].href) {
                re.push(sheet[i].href);
            }
        }
        return re;
    };
    var getFontFaces = function () {
        var sheet = document.styleSheets,
            rule = null,
            i = sheet.length, j;
        var urlQueue = [];
        var interRules = [];
        while (0 <= --i) {
            if (sheet[i].href) {
                urlQueue.push(sheet[i].href);
            } else {
                rule = sheet[i].rules || sheet[i].cssRules || [];
                j = rule.length;
                while (0 <= --j) {
                    if (rule[j].constructor.name === 'CSSFontFaceRule') {
                        interRules.push(recoverCssUrls(rule[j].cssText, window.location.href));
                    };
                }
            }
        }
        return Promise.all(urlQueue.map(url => {
            return fetch(conf.serverHost + '/get/' + encodeURIComponent(url), {
                mode: 'cors',
                headers: {'Content-Type': 'text/plain'}
            }).then(res => {
                return res.text().then(data => {
                    var regExp = /@font-face\s*\{[^}]+}/g;
                    var results = data.match(regExp) || [];
                    return interRules.concat(results.map(result => recoverCssUrls(result, url)));
                });
            }).catch(err => {
                console.error(err);
            });
        }));
    };

    var PropertyTable = {
        'display': {},
        'zoom': {},
        'flex-direction': {},
        'flex-wrap': {},
        'flex-flow': {},
        'justify-content': {},
        'align-items': {},
        'align-content': {},
        'order': {},
        'flex-grow': {},
        'flex-shrink': {},
        'flex-basis': {},
        'flex': {},
        'align-self': {},
        'position': {},
        'z-index': {},
        'width': {},
        'height': {},
        'max-width': {},
        'min-width': {},
        'max-height': {},
        'min-height': {},
        'top': {},
        'right': {},
        'bottom': {},
        'left': {},
        'background': {},
        // 'background-color': {},
        // 'background-size': {},
        'margin': {},
        // 'margin-top': {},
        // 'margin-right': {},
        // 'margin-bottom': {},
        // 'margin-left': {},
        'padding': {},
        // 'padding-top': {},
        // 'padding-right': {},
        // 'padding-bottom': {},
        // 'padding-left': {},
        'border': {
            ignore: function (v) {
                return v.indexOf('none') >= 0;
            }
        },
        'border-top': {
            ignore: function (v) {
                return v.indexOf('none') >= 0;
            }
        },
        'border-right': {
            ignore: function (v) {
                return v.indexOf('none') >= 0;
            }
        },
        'border-bottom': {
            ignore: function (v) {
                return v.indexOf('none') >= 0;
            }
        },
        'border-left': {
            ignore: function (v) {
                return v.indexOf('none') >= 0;
            }
        },
        'border-radius': {},
        'border-collapse': {
            inherit: true
        },
        'border-spacing': {
            inherit: true
        },
        'box-shadow': {},
        'box-sizing': {},
        'outline': {
            ignore: function (v) {
                return v.indexOf('none') >= 0;
            }
        },
        'color': {
            inherit: true
        },
        'text-align': {
            inherit: true
        },
        'text-indent': {
            inherit: true
        },
        'text-overflow': {},
        'overflow': {},
        'cursor': {
            inherit: true
        },
        'float': {},
        'clear': {},
        'font': {
            inherit: true
        },
        /*
        'font-family': {
            inherit: true
        },
        'font-size': {
            inherit: true
        },
        'font-weight': {
            inherit: true
        },
        'font-style': {
            inherit: true
        },
        */
        'letter-spacing': {
            inherit: true
        },
        'line-height': {
            inherit: true
        },
        'list-style': {
            inherit: true
        },
        'opacity': {},
        'visibility': {
            inherit: true
        },
        'text-decoration': {},
        'vertical-align': {},
        'white-space': {
            inherit: true
        },
        'word-break': {},
        'word-wrap': {},
        'content': {},
        'transform': {},
        'transition': {}
    };

    var cleanComputedStyle = function (cs) {
        if (cs['border-top'] === cs['border']) delete cs['border-top'];
        if (cs['border-right'] === cs['border']) delete cs['border-right'];
        if (cs['border-bottom'] === cs['border']) delete cs['border-bottom'];
        if (cs['border-left'] === cs['border']) delete cs['border-left'];
    };

    var propNameCamelify = function (name) {
        var parts = name.split('-');
        var re = parts[0] || '';
        for (var i = 1, len = parts.length; i < len; i++) {
            var p = parts[1];
            re += p.substr(0, 1).toUpperCase() + p.substr(1);
        }
        return re;
    };

    var getFullStyle = function (dom, pseudo) {
        var cs = !pseudo ? getComputedStyle(dom) : getComputedStyle(dom, ':' + pseudo);
        var ncs = (pseudo && !pseudoClassTable[pseudo].element) ? getComputedStyle(dom) 
            : getNodeDefaultCS((pseudo && pseudoClassTable[pseudo].element === 'inline') ? 'span' : dom.nodeName.toLowerCase());
        var re = {};
        for (var prop in PropertyTable) {
            var cprop = propNameCamelify(prop);
            if (cs[cprop] && (preventDefaultProps[dom.nodeName.toLowerCase() + ' ' + prop]
                || (cs[cprop] !== ncs[cprop] && (!PropertyTable[prop].ignore || !PropertyTable[prop].ignore(cs[cprop]))))) {
                re[prop] = cs[cprop];
            }
        }
        cleanComputedStyle(re);
        return re;
    };

    var pseudoClassTable = {
        'before': { element: 'inline' },
        'after': { element: 'inline' }
    };
    var getPseudoElements = function (dom, domStyle) {
        var re = {};
        for (var p in pseudoClassTable) {
            if (pseudoClassTable[p].element) {
                var cs = getComputedStyle(dom, ':' + p);
                if (cs.content) {
                    re[p] = getFullStyle(dom, p);
                }
            } else {
                var ps = getFullStyle(dom, p);
                var stylePatches = {};
                var diff = false;
                for (var i in domStyle) {
                    if (domStyle[i] !== ps[i]) {
                        stylePatches[i] = ps[i];
                        diff = true;
                    }
                }
                if (diff) {
                    re[p] = stylePatches;
                    console.log('[LOG]', stylePatches);
                }
            }
        }
        if (Object.keys(re).length === 0) return null;
        return re;
    };

    var preventDefaultProps = {
        'a color': true,
        'a text-decoration': true,
        'input outline': true,
        'input border': true,
        'textarea outline': true,
        'textarea border': true
    };

    var getMetaData = function (dom) {
        var metaShow = getFullMetaData(dom);
        dom.style.display = 'none';
        var metaHide = getFullMetaData(dom);
        var patch = function (node1, node2) {
            if (!node1.style) return;
            for (var p in node1.style) {
                if (/px/.test(node1.style[p])
                    && p !== 'transform' && p != 'transition') {
                    node1.style[p] = node2.style[p];
                    if (node1.style[p] === 'auto' || node1.style[p] === undefined) {
                        delete node1.style[p];
                    }
                }
            }
            if (node1.childNodes) {
                for (var i = 0, len = node1.childNodes.length; i < len; i++) {
                    patch(node1.childNodes[i], node2.childNodes[i]);
                }
            }
        };
        patch(metaShow, metaHide);
        return metaShow;
    };
    var getMetaData_test = function (dom) {
        var display = getComputedStyle(dom)['display'];
        dom.style.display = 'none';
        var re = getFullMetaData(dom);
        re.style.display = display;
        return re;
    };

    var reservedAttrs = {
        'a': ['href', 'target'],
        'img': ['src'],
        'input': ['placeholder']
    };
    
    var getFullMetaData = function (dom) {
        var type = dom.nodeName.toLowerCase();
        if (type === 'meta') return null;
        if (type === '#comment') return null;
        if (type === '#text') {
            return {
                nodeName: '#text',
                value: dom.nodeValue
            };
        }
        var meta = {
            nodeName: type,
            style: getFullStyle(dom),
            attrs: {}
        };
        
        if (reservedAttrs[type]) {
            for (let an of reservedAttrs[type]) {
                var av = dom.getAttribute(an);
                if (av) {
                    meta.attrs[an] = (an === 'href' || an === 'src') ? recoverUrl(window.location.href, av) : av;
                }
            }
        }
        
        if (Object.keys(meta.attrs).length === 0) {
            delete meta.attrs;
        }

        meta.pseudo = getPseudoElements(dom, meta.style);
        if (!meta.pseudo) delete meta.pseudo;

        if (dom.childNodes.length) {
            meta.childNodes = [];
            dom.childNodes.forEach(function (el, i) {
                var childData = getFullMetaData(el);
                if (!childData) return true;
                if (childData.nodeName !== '#text') {
                    var dupProps = [];
                    for (var i in childData.style) {
                        if (!preventDefaultProps[childData.nodeName + ' ' + i]
                            && PropertyTable[i].inherit
                            && meta.style[i] === childData.style[i]) {
                            dupProps.push(i);
                        }
                    }
                    dupProps.forEach(function (p) {
                        delete childData.style[p];
                    });
                }
                meta.childNodes.push(childData);
            });
        }

        return meta;
    };

    var styleSheetData = {};
    var nodeTypeCount = {};
    var cssRuleValueHash2Name = {};
    var cssRuleName2ValueHash = {};
    var stringOfStyleObj = function (obj) {
        var props = [];
        for (var p in obj) {
            props.push(p + ':' + obj[p] + ';');
        }
        return props.join('');
    };
    var addCssRule = function (nodeName, obj, pseudo) {
        var self = stringOfStyleObj(obj);
        var selfHash = self.hashCode();
        
        var pseudoValues = {};
        var pseudoHashes = {};
        if (pseudo) {
            for (var p in pseudo) {
                pseudoValues[p] = !pseudo[p] ? undefined : stringOfStyleObj(pseudo[p]);
                pseudoHashes[p] = pseudoValues[p] ? pseudoValues[p].hashCode() : undefined;
            }
        }

        if (cssRuleValueHash2Name[selfHash]) {
            var existingNameList = cssRuleValueHash2Name[selfHash];
            for (let existingName of existingNameList) {
                var consistent = true;
                for (var p in pseudoClassTable) {
                    if (cssRuleName2ValueHash[existingName + ':' + p] !== pseudoHashes[p]) {
                        consistent = false;
                        break;
                    }
                }
                if (consistent) {
                    return existingName;
                }
            }
        }
        
        if (!nodeTypeCount[nodeName]) nodeTypeCount[nodeName] = 0;
        nodeTypeCount[nodeName]++;
        var className = nodeName.toUpperCase() + nodeTypeCount[nodeName];
        
        if (!cssRuleValueHash2Name[selfHash]) cssRuleValueHash2Name[selfHash] = [];
        cssRuleValueHash2Name[selfHash].push(className);
        for (var p in pseudoHashes) {
            if (pseudoHashes[p]) cssRuleName2ValueHash[className + ':' + p] = pseudoHashes[p];
        }
        cssRuleName2ValueHash[className] = selfHash;
        
        styleSheetData['.' + className] = self;
        for (var p in pseudoValues) {
            if (pseudoValues[p]) styleSheetData['.' + className + ':' + p] = pseudoValues[p];
        }
        
        return className;
    };

    var helperIframe;

    var getNodeDefaultCS = function (nodeName) {
        var iframeId = 'qwe123';
        if (!helperIframe) {
            helperIframe = document.createElement('iframe');
            helperIframe.id = iframeId;
            document.body.appendChild(helperIframe);
        }
        var iframeDoc = helperIframe.contentDocument;
        var iframeNodes = iframeDoc.getElementsByTagName(nodeName);
        var node;
        if (iframeNodes.length) node = iframeNodes[0];
        else {
            node = iframeDoc.createElement(nodeName);
            iframeDoc.body.appendChild(node);
        }
        return getComputedStyle(node);
    };

    var buildDom = function (meta) {
        if (meta.nodeName === '#text') {
            return document.createTextNode(meta.value);
        }
        var dom = document.createElement(meta.nodeName);

        if (meta.attrs) {
            for (var k in meta.attrs) {
                dom.setAttribute(k, meta.attrs[k]);
            }
        }

        dom.className = addCssRule(meta.nodeName, meta.style, meta.pseudo);

        if (meta.childNodes) {
            meta.childNodes.forEach(function (child) {
                dom.appendChild(buildDom(child));
            });
        }

        return dom;
    };

    var extendObj = function (dest, src) {
        for (var i in src) {
            dest[i] = src[i];
        }
        return dest;
    };
    var presentDom = function (dom, moduleName, options) {
        extendObj(conf, options);
        moduleName = moduleName || 'module';
        var styleSheet = document.createElement('style');
        
        var outputFlag = 0;
        var output = () => {
            console.log({
                style: styleSheet.innerHTML,
                html: document.body.innerHTML
            });
        };
        
        var promises = [];
        
        if (conf.fetchFont) {
            promises.push(getFontFaces().then(results => {
                styleSheet.innerHTML = results.map(result => result.join('')).join('') + styleSheet.innerHTML;
                console.log('[SUCCESS] to get all font-face rules.');
            }).catch(() => {
                console.error('[ERROR] to get all font-face rules.');
            }));
        }
        
        var rootMeta = getMetaData(dom);
        document.head.innerHTML = '';
        document.body.innerHTML = '';
        document.head.appendChild(styleSheet);
        
        var ndom = buildDom(rootMeta);
        var moduleClassNameAlready = ndom.className;
        var moduleClassAlone = !ndom.getElementsByClassName('moduleClassNameAlready').length;
        ndom.className = moduleClassAlone ? moduleName : (moduleName + ' ' + moduleClassNameAlready);
        var styleString = '';
        for (var sel in styleSheetData) {
            if (sel === '.' + moduleClassNameAlready || sel.startsWith('.' + moduleClassNameAlready + ':')) {
                if (moduleClassAlone) {
                    var selector = '.' + moduleName + (sel.startsWith('.' + moduleClassNameAlready + ':') ? sel.substr(sel.indexOf(':')) : '');
                    styleString += selector + '{' + styleSheetData[sel] + '}';
                    continue;
                } else {
                    styleString += '.' + moduleName + sel + '{' + styleSheetData[sel] + '}';
                }
            }
            styleString += '.' + moduleName + ' ' + sel + '{' + styleSheetData[sel] + '}';
        }
        styleSheet.innerHTML += styleString;

        document.body.appendChild(ndom);
        
        Promise.all(promises).then(() => output());
    };

    window.fespider = {
        getMetaData: getMetaData,
        present: presentDom
    };

})();
