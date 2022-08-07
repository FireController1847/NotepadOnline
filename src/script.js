// Global Variables
var hotkeysVisible = false;
var openSubmenuMenu = null;
var openSubmenu = null;
var textArea = null;
var infoCursorPos = null;
var programName = "Notepad Online";
var unsavedChanges = false;
var documentTitle = "Untitled";
var savedContents = "";
var documentContents = "";
var existingFileHandle = null;
var zoom = 100;
var fontFamily = "Consolas";
var fontSize = 14; // in pixels
var wordWrap = true;
var lineEndings = "lf";
var charset = "UTF-8";
var undoCount = 5;

// Handle Hotkeys
function updateUnderlineHotkeys(showHotkeys) {
    var buttons = document.getElementsByClassName("hotkey");
    for (var i = 0; i < buttons.length; i++) {
        if (showHotkeys) {
            buttons[i].classList.add("enabled");
        } else {
            buttons[i].classList.remove("enabled");
        }
    }
}
function handleHotkeys(e) {
    if (openSubmenu != null) {
        if (e.code == "ArrowDown") {
            var activeFound = false;
            performActionOnEachSubmenuButton(openSubmenu, function(button) {
                if (activeFound) {
                    button.focus();
                    return true;
                }
                if (button == document.activeElement) {
                    activeFound = true;
                }
            });
            if (activeFound == false) {
                openSubmenu.children[0].children[0].focus();
            }
            return;
        } else if (e.code == "ArrowUp") {
            var prevButton = null;
            performActionOnEachSubmenuButton(openSubmenu, function(button) {
                if (button == document.activeElement) {
                    if (prevButton != null) {
                        prevButton.focus();
                    }
                    return true;
                } else {
                    prevButton = button;
                }
            });
            return;
        } else if (e.code == "ArrowRight") {
            var nextMenu = openSubmenuMenu.parentNode.nextElementSibling;
            if (nextMenu != null) {
                closeSubmenu(openSubmenu, false);
                nextMenu.children[0].click();
            }
            return;
        } else if (e.code == "ArrowLeft") {
            var prevMenu = openSubmenuMenu.parentNode.previousElementSibling;
            if (prevMenu != null) {
                closeSubmenu(openSubmenu, false);
                prevMenu.children[0].click();
            }
            return;
        }
    }
    if (e.code == "F5") {
        if (document.activeElement == textArea) {
            insertTimeDate();
        }
        e.preventDefault();
    } else if (e.altKey == true) {
        if (e.code == "AltLeft" || e.code == "AltRight") {
            hotkeysVisible = true;
            updateUnderlineHotkeys(true);
            e.preventDefault();
        } else if (e.code == "KeyF") {
            var menuButton = document.getElementById("btn-menu-file");
            menuButton.click();
            e.preventDefault();
        } else if (e.code == "KeyE") {
            var menuButton = document.getElementById("btn-menu-edit");
            menuButton.click();
            e.preventDefault();
        } else if (e.code == "KeyO") {
            var menuButton = document.getElementById("btn-menu-format");
            menuButton.click();
            e.preventDefault();
        } else if (e.code == "KeyV") {
            var menuButton = document.getElementById("btn-menu-view");
            menuButton.click();
            e.preventDefault();
        } else if (e.code == "KeyH") {
            var menuButton = document.getElementById("btn-menu-help");
            menuButton.click();
            e.preventDefault();
        }
    } else if (e.ctrlKey == true) {
        // Well, the code is here for them, but many browsers don't allow overriding them.
        // So, I'll leave it in hopes one day they do.
        if (e.code == "KeyN") {
            document.getElementById("btn-submenu-file-new").click();
            e.preventDefault();
        } else if (e.shiftKey == true && e.code == "KeyN") {
            document.getElementById("btn-submenu-file-newtab").click();
            e.preventDefault();
        } else if (e.code == "KeyO") {
            document.getElementById("btn-submenu-file-open").click();
            e.preventDefault();
        } else if (e.shiftKey == true && e.code == "KeyS") {
            document.getElementById("btn-submenu-file-saveas").click();
            e.preventDefault();
        } else if (e.code == "KeyS") {
            document.getElementById("btn-submenu-file-save").click();
            e.preventDefault();
        }
    } else if (hotkeysVisible == true) {
        updateUnderlineHotkeys(false);
    }
}

// Called when the document's contents is changed
function documentContentsChanged() {
    documentContents = document.getElementById("text-area").innerHTML;
    if (documentContents.replace(/\r|\n/g, "") != savedContents.replace(/\r|\n/g, "")) {
        unsavedChanges = true;
    } else {
        unsavedChanges = false;
    }
    updateTitle();
    if (documentContents != "") {
        enableSubmenuButton(document.getElementById("btn-submenu-edit-undo"));
    } else {
        disableSubmenuButton(document.getElementById("btn-submenu-edit-undo"));
    }
}

// Enables or Disables a "Menu Button"
function enableSubmenuButton(element) {
    element.classList.remove("disabled");
}
function disableSubmenuButton(element) {
    element.classList.add("disabled");
}

// Handle Menu Buttons
function onMenuButtonPress(menu, submenu, shouldFocus = false) {
    if (openSubmenu != null && !(submenu == openSubmenu)) {
        closeSubmenu(openSubmenu, false);
    }
    if (openSubmenu == null) {
        submenu.classList.add("openanim");
    }
    if (submenu != openSubmenu) {
        openSubmenu = submenu;
        openSubmenuMenu = menu;
        openSubmenuMenu.classList.add("menu-opened");
        submenu.classList.remove("closed");
    }
    var menuIndex = parseInt(menu.getAttribute("tabindex"));
    var first = true;
    performActionOnEachSubmenuButton(submenu, function(button) {
        button.setAttribute("tabindex", menuIndex + 1);
        if (first && shouldFocus) {
            first = false;
            button.focus();
        }
    });
}
function onMenuHover(menu, submenu) {
    if (openSubmenu != null && submenu != openSubmenu) {
        onMenuButtonPress(menu, submenu);
    }
}
function onSubmenuHover(submenu) {
    document.activeElement.blur();
}
function closeSubmenu(target = null, final = true) {
    if (openSubmenu != null) {
        if (target != null) {
            var prevParent = target;
            do {
                prevParent = prevParent.parentNode;
                if (prevParent == openSubmenu) {
                    return;
                }
            } while (prevParent != null);
        }
        openSubmenu.classList.add("closed");
        openSubmenuMenu.classList.remove("menu-opened");
        performActionOnEachSubmenuButton(openSubmenu, function(button) {
            button.setAttribute("tabindex", "-1");
        });
        if (final) {
            // Give the button press event time to fire.
            setTimeout(function() {
                openSubmenu = null;
                openSubmenuMenu = null;
                var children = document.getElementById("submenus").children;
                for (var i = 0; i < children.length; i++) {
                    children[i].classList.remove("openanim");
                }
            }, 100);
        }
    }
}
function performActionOnEachSubmenuButton(submenu, action) {
    outer_loop: for (var i = 0; i < submenu.children.length; i++) {
        if (submenu.children[i].tagName == "DIV") {
            for (var j = 0; j < submenu.children[i].children.length; j++) {
                if (submenu.children[i].children[j].tagName == "BUTTON" && !submenu.children[i].children[j].classList.contains("disabled")) {
                    var shouldBreak = action(submenu.children[i].children[j]);
                    if (shouldBreak) {
                        break outer_loop;
                    }
                }
            }
        }
    }
}

// Updates the document title
function updateTitle() {
    var title = "";
    if (unsavedChanges == true) {
        title += "*";
    }
    title += documentTitle + " - " + programName;
    document.title = title;
}

// Caret
function getCaretPosition(element) {
    // Ensure valid first-child
    if (element.firstChild == null) {
        return {
            "ln": 1,
            "col": 1
        }
    }

    // Check for selection
    if (window.getSelection().type == "None") {
        return {
            "ln": -1,
            "col": -1
        }
    }

    // Copy range
    var selection = window.getSelection();
    var range = selection.getRangeAt(0).cloneRange();

    // Collapse range
    range.collapse();

    // Move range to encompass everything
    range.setStart(element.firstChild, 0);

    // Calculate position
    var content = range.toString();
    var text = JSON.stringify(content);
    var lines = (text.match(/\\n/g) || []).length;
    

    // Calculate true column
    var trueTextLength = text.length - 2;
    // TODO: This could be a cool feature later on. Document length! :)
    // var visibleTextLength = trueTextLength - (lines * 2);
    var lastNewlineIndex = text.lastIndexOf("\\n");
    var trueColumn = trueTextLength - lastNewlineIndex;

    // Debug
    // console.log(text);
    // console.log("True Text Length: ", trueTextLength);
    // console.log("Number of Newlines: ", lines);
    // console.log("Last Newline Index: ", lastNewlineIndex)
    // console.log("Column: ", trueTextLength - lastNewlineIndex);

    // Return caret position (col - 2 due to some weird calculation with regex)
    return {
        "ln": lines + 1,
        "col": trueColumn
    }
}
function insertTimeDate() {
    insertAtCaret(document.getElementById("text-area"), (new Date()).toLocaleString(), true);
}
function insertAtCaret(element, text, shouldDelete = false) {
    // Copy range
    var selection = window.getSelection();
    var range = selection.getRangeAt(0);

    // Delete
    if (shouldDelete) {
        range.deleteContents();
    }

    // Collapse range
    range.collapse();

    // Create text node
    var node = document.createTextNode(text);

    // Move range to encompass everything
    range.insertNode(node);
    
    // Document contents changed
    documentContentsChanged();

    // Update start
    range.setStart(node, 0);

    // Collapse
    range.collapse();
}
function updateColAndLn(caretPos) {
    if (caretPos.ln == -1 || caretPos.col == -1) {
        return;
    }
    infoCursorPos.innerHTML = "Ln " + caretPos.ln + ", Col " + caretPos.col
}

// Ensures the Text Area Contents is Valid
function validateTextArea() {
    // Flatten Newlines
    var childNodes = textArea.childNodes;
    for (var i = 0; i < childNodes.length; i++) {
        if (childNodes[i].nodeValue != null && childNodes[i].nodeValue.indexOf("\n") != -1) {
            var split = childNodes[i].nodeValue.split(/\n/g);
            childNodes[i].remove();
            for (var j = 0; j < split.length; j++) {
                childNodes.splice(i, 0, document.createTextNode(split[j]));
            }
        }
    }
}

// Creates a new file
function newFile() {
    documentTitle = "Untitled";
    savedContents = "";
    documentContents = "";
    textArea.innerHTML = "";
    existingFileHandle = null;
    updateColAndLn({"ln": 1, "col": 1});
    documentContentsChanged();
}

var utf8ArrayToStr = (function () {
    var charCache = new Array(128);  // Preallocate the cache for the common single byte chars
    var charFromCodePt = String.fromCodePoint || String.fromCharCode;
    var result = [];

    return function (array) {
        var codePt, byte1;
        var buffLen = array.length;

        result.length = 0;

        for (var i = 0; i < buffLen;) {
            byte1 = array[i++];

            if (byte1 <= 0x7F) {
                codePt = byte1;
            } else if (byte1 <= 0xDF) {
                codePt = ((byte1 & 0x1F) << 6) | (array[i++] & 0x3F);
            } else if (byte1 <= 0xEF) {
                codePt = ((byte1 & 0x0F) << 12) | ((array[i++] & 0x3F) << 6) | (array[i++] & 0x3F);
            } else if (String.fromCodePoint) {
                codePt = ((byte1 & 0x07) << 18) | ((array[i++] & 0x3F) << 12) | ((array[i++] & 0x3F) << 6) | (array[i++] & 0x3F);
            } else {
                codePt = 63;    // Cannot convert four byte code points, so use "?" instead
                i += 3;
            }

            result.push(charCache[codePt] || (charCache[codePt] = charFromCodePt(codePt)));
        }

        return result.join('');
    };
})();

// Opens an existing file
function openFile(handle) {
    newFile();
    existingFileHandle = handle;
    existingFileHandle.getFile().then(function(file) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var detection = jschardet.detect(e.target.result);
            charset = detection.encoding.toUpperCase();
            // Force all ASCII into UTF-8
            // Temporary bug? See https://github.com/aadsm/jschardet/issues/22
            if (charset == "ASCII") {
                charset = "UTF-8";
            }
            updateCharset();
            reader = new FileReader();
            reader.onload = function(e) {
                var content = e.target.result;
                if (content.indexOf("\r\n") != -1) {
                    lineEndings = "crlf";
                } else if (content.indexOf("\r") != -1) {
                    lineEndings = "cr";
                } else {
                    lineEndings = "lf";
                }
                updateLineEndings();
                savedContents = content;
                documentContents = content;
                documentTitle = file.name;
                textArea.innerHTML = content;
                updateColAndLn(getCaretPosition(document.getElementById("text-area")));
                documentContentsChanged();
            }
            reader.readAsText(file, charset);
        }
        reader.readAsBinaryString(file);
    });
}
function save() {
    console.log("Existing file: ", existingFileHandle);
    if (existingFileHandle == null) {
        saveAs();
        return;
    }
    console.log("Saving...");
    // TODO: Save encodings.
    // Apply line endings
    if (lineEndings == "crlf") {
        documentContents = documentContents.replace(/(?<!\r)\n|\r(?!\n)/g, "\r\n");
    } else if (lineEndings == "cr") {
        documentContents = documentContents.replace(/\r\n|\n/g, "\r");
    } else {
        documentContents = documentContents.replace(/\r\n|\r/g, "\n");
    }
    existingFileHandle.createWritable().then(function(writable) {
        writable.write(documentContents).then(function(response) {
            savedContents = documentContents;
            documentContentsChanged();
            console.log("Saved!");
            writable.close();
        }).catch(function(e) {
            writable.close();
            saveAs();
        })
    });
}
function saveAs() {
    window.showSaveFilePicker({
        suggestedName: documentTitle,
        types: [{
            description: "Text document",
            accept: {'text/plain': ['.txt']}
        }]
    }).then(function(handle) {
        existingFileHandle = handle;
        save();
    });
}

// Updates the zoom visually
function updateZoom() {
    document.getElementById("info-zoom").innerHTML = zoom + "%";
    var ta = document.getElementById("text-area");
    var zoomedFontSize = fontSize * (zoom / 100);
    ta.style.fontSize = zoomedFontSize + "px";
    ta.style.lineHeight = zoomedFontSize + 2 + "px";
}

// Updates the word wrap visually
function updateWordWrap() {
    var ta = document.getElementById("text-area");
    if (wordWrap == true) {
        ta.style.whiteSpace = "pre-wrap";
    } else {
        ta.style.whiteSpace = "pre";
    }
}

// Updates the line endings visually
function updateLineEndings() {
    var info = document.getElementById("info-eol");
    if (lineEndings == "crlf") {
        info.innerHTML = "Windows (CRLF)";
    } else if (lineEndings == "lf") {
        info.innerHTML = "Unix (LF)";
    } else {
        info.innerHTML = "Macintosh (CR)";
    }
}

// Updates the charset visually
function updateCharset() {
    var info = document.getElementById("info-charset");
    info.innerHTML = charset;
}

// Called whenever there's a change of selection
function selectionChange() {
    var selection = window.getSelection();
    if (selection.toString() == '') {
        disableSubmenuButton(document.getElementById("btn-submenu-edit-cut"));
        disableSubmenuButton(document.getElementById("btn-submenu-edit-copy"));
        disableSubmenuButton(document.getElementById("btn-submenu-edit-delete"));
        disableSubmenuButton(document.getElementById("btn-submenu-edit-search"));
    } else {
        enableSubmenuButton(document.getElementById("btn-submenu-edit-cut"));
        enableSubmenuButton(document.getElementById("btn-submenu-edit-copy"));
        enableSubmenuButton(document.getElementById("btn-submenu-edit-delete"));
        enableSubmenuButton(document.getElementById("btn-submenu-edit-search"));
    }
}

// Handle Keystrokes
document.addEventListener("keydown", function(e) {
    console.log(e);
    handleHotkeys(e);
}, { passive: false });
document.addEventListener("selectionchange", function(e) {
    selectionChange();
    if (window.getSelection() != null && document.activeElement == textArea) {
        updateColAndLn(getCaretPosition(document.getElementById("text-area")));
    }
});
document.addEventListener("mousedown", function(e) {
    if (hotkeysVisible == true) {
        updateUnderlineHotkeys(false);
    }
    closeSubmenu(e.target);
});
document.addEventListener("mousewheel", function(e) {
    //console.log(e);
    if (e.ctrlKey) {
        e.preventDefault();
        if (e.deltaY > 0) {
            if (zoom > 10) {
                zoom -= 10;
            }
        } else {
            if (zoom < 500) {
                zoom += 10;
            }
        }
        updateZoom();
    }
}, { passive: false });

// On Load
document.addEventListener("DOMContentLoaded", function(e) {
    // Fill Variables
    textArea = document.getElementById("text-area");
    infoCursorPos = document.getElementById("info-cursor-pos");

    // Menu Button Events
    var btnMenuFile = document.getElementById("btn-menu-file");
    var submenuFile = document.getElementById("submenu-file");
    btnMenuFile.onclick = function(e) {
        onMenuButtonPress(btnMenuFile, submenuFile, e.pointerId == -1);
    }
    btnMenuFile.addEventListener("mouseover", function() {
        onMenuHover(btnMenuFile, submenuFile);
    });
    submenuFile.style.marginLeft = btnMenuFile.offsetLeft + 'px';

    var btnMenuEdit = document.getElementById("btn-menu-edit");
    var submenuEdit = document.getElementById("submenu-edit");
    btnMenuEdit.onclick = function(e) {
        onMenuButtonPress(btnMenuEdit, submenuEdit, e.pointerId == -1);
    }
    btnMenuEdit.addEventListener("mouseover", function() {
        onMenuHover(btnMenuEdit, submenuEdit);
    });
    submenuEdit.style.marginLeft = btnMenuEdit.offsetLeft + 'px';

    var btnMenuFormat = document.getElementById("btn-menu-format");
    var submenuFormat = document.getElementById("submenu-format");
    btnMenuFormat.onclick = function(e) {
        onMenuButtonPress(btnMenuFormat, submenuFormat, e.pointerId == -1);
    }
    btnMenuFormat.addEventListener("mouseover", function() {
        onMenuHover(btnMenuFormat, submenuFormat);
    });
    submenuFormat.style.marginLeft = btnMenuFormat.offsetLeft + 'px';

    var btnMenuView = document.getElementById("btn-menu-view");
    var submenuView = document.getElementById("submenu-view");
    btnMenuView.onclick = function(e) {
        onMenuButtonPress(btnMenuView, submenuView, e.pointerId == -1);
    }
    btnMenuView.addEventListener("mouseover", function() {
        onMenuHover(btnMenuView, submenuView);
    });
    submenuView.style.marginLeft = btnMenuView.offsetLeft + 'px';

    var btnMenuHelp = document.getElementById("btn-menu-help");
    var submenuHelp = document.getElementById("submenu-help");
    btnMenuHelp.onclick = function(e) {
        onMenuButtonPress(btnMenuHelp, submenuHelp, e.pointerId == -1);
    }
    btnMenuHelp.addEventListener("mouseover", function() {
        onMenuHover(btnMenuHelp, submenuHelp);
    });
    submenuHelp.style.marginLeft = btnMenuHelp.offsetLeft + 'px';

    // Submenu Button Events
    var submenuFileNew = document.getElementById("btn-submenu-file-new");
    // TODO: Save confirmation prompt!!!
    submenuFileNew.onclick = function() {
        newFile();
        closeSubmenu();
    }

    var submenuFileNewTab = document.getElementById("btn-submenu-file-newtab");
    submenuFileNewTab.onclick = function() {
        window.open(location.href);
        closeSubmenu();
    }

    var submenuFileOpen = document.getElementById("btn-submenu-file-open");
    submenuFileOpen.onclick = function() {
        window.showOpenFilePicker({
            types: [{
                description: "Text document",
                accept: {'text/plain': ['.txt']}
            }],
            multiple: false
        }).then(function(handles) {
            openFile(handles[0]);
        });
        closeSubmenu();
    }

    var submenuFileSave = document.getElementById("btn-submenu-file-save");
    submenuFileSave.onclick = function() {
        save();
        closeSubmenu();
    }

    var submenuFileSaveAs = document.getElementById("btn-submenu-file-saveas");
    submenuFileSaveAs.onclick = function() {
        saveAs();
        closeSubmenu();
    }

    var submenuFileExit = document.getElementById("btn-submenu-file-exit");
    submenuFileExit.onclick = function() {
        window.close();
    }

    var submenuEditUndo = document.getElementById("btn-submenu-edit-undo");
    submenuEditUndo.onclick = function() {
        if (submenuEditUndo.classList.contains("disabled")) {
            return;
        }
        for (var i = 0; i < undoCount; i++) {
            document.execCommand("undo");
        }
        closeSubmenu();
    }

    var submenuEditCut = document.getElementById("btn-submenu-edit-cut");
    submenuEditCut.onclick = function() {
        if (submenuEditCut.classList.contains("disabled")) {
            return;
        }
        closeSubmenu();
        document.execCommand("cut");
        documentContentsChanged();
        // var selection = window.getSelection();
        // var text = selection.toString();
        // navigator.clipboard.writeText(text).then(function() {
        //     selection.deleteFromDocument();
        //     selectionChange();
        //     documentContentsChanged();
        // });
    }

    var submenuEditCopy = document.getElementById("btn-submenu-edit-copy");
    submenuEditCopy.onclick = function() {
        if (submenuEditCopy.classList.contains("disabled")) {
            return;
        }
        closeSubmenu();
        var selection = window.getSelection();
        var text = selection.toString();
        navigator.clipboard.writeText(text);
    }

    var submenuEditDelete = document.getElementById("btn-submenu-edit-delete");
    submenuEditDelete.onclick = function() {
        if (submenuEditDelete.classList.contains("disabled")) {
            return;
        }
        var selection = window.getSelection();
        selection.deleteFromDocument();
        selectionChange();
        documentContentsChanged();
        closeSubmenu();
    }

    var submenuEditPaste = document.getElementById("btn-submenu-edit-paste");
    submenuEditPaste.onclick = function() {
        closeSubmenu();
        var ta = document.getElementById("text-area");
        ta.focus();
        navigator.clipboard.readText().then(function(text) {
            insertAtCaret(ta, text, true);
        });
    }

    var submenuEditSearch = document.getElementById("btn-submenu-edit-search");
    submenuEditSearch.onclick = function() {
        if (submenuEditSearch.classList.contains("disabled")) {
            return;
        }
        closeSubmenu();
        window.open("https://www.bing.com/search?q=" + encodeURI(window.getSelection().toString()));
    }

    var submenuEditSelectAll = document.getElementById("btn-submenu-edit-selectall");
    submenuEditSelectAll.onclick = function() {
        var selection = window.getSelection();
        selection.removeAllRanges();
        selection.selectAllChildren(textArea);
        closeSubmenu();
    }

    var submenuEditTimeDate = document.getElementById("btn-submenu-edit-timedate");
    submenuEditTimeDate.onclick = function() {
        textArea.focus();
        insertTimeDate();
        closeSubmenu();
    }

    var submenuFormatWordWrap = document.getElementById("btn-submenu-format-wordwrap");
    submenuFormatWordWrap.onclick = function() {
        // TODO: Show checkmark
        wordWrap = !wordWrap;
        updateWordWrap();
        closeSubmenu();
    }

    var submenuViewStatusbar = document.getElementById("btn-submenu-view-statusbar");
    submenuViewStatusbar.onclick = function() {
        var el = document.getElementById("info-area");
        console.log(el.style.display);
        if (el.style.display == "") {
            el.style.display = "none";
            document.getElementById("text-area").style.bottom = "0px";
        } else {
            el.style.display = "";
            document.getElementById("text-area").style.bottom = "24px";
        }
        closeSubmenu();
    }

    // Submenu Hover Events
    var submenus = document.getElementById("submenus");
    for (var i = 0; i < submenus.children.length; i++) {
        performActionOnEachSubmenuButton(submenus.children[i], function(button) {
            button.addEventListener("mouseover", onSubmenuHover);
        });
    }

    // Handle Text Area Changed
    textArea.addEventListener("input", function(e) {
        //console.log("Contents changed!", e);

        // Force position update on blank screen
        if (textArea.innerHTML == "") {
            updateColAndLn(getCaretPosition(document.getElementById("text-area")));
        }

        // Update document contents
        documentContents = textArea.innerHTML;
        documentContentsChanged();
    });
});