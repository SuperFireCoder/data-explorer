import { Button, Pre } from "@blueprintjs/core";
import { useRef } from "react";

/**
 * Generates code snippet text for a given data URL
 *
 * @param {string} language Target language to generate snippet for
 * @param {string} url URL of source data for snippet
 * @param {string} filename Filename for downloaded file in snippet
 * @param {string} [publisher] Publisher of source data
 * @param {string} [contact] Contact point (e.g. email address) for source data
 * @param {string} [license] License governing use of source data
 * @param {string} [landingPage] URL to landing page related to source data
 */
function generateSnippetText(
    language: "python" | "r" | "bash" | "web-access",
    url: string,
    filename: string,
    publisher?: string,
    contact?: string,
    license?: string,
    landingPage?: string
) {
    const commentBlockContents = [
        publisher && `Publisher: ${publisher}`,
        contact && `Contact point: ${contact}`,
        license && `License: ${license}`,
        landingPage && `Full page: ${landingPage}`,
    ].filter((line) => line); // Removes lines which we don't have any info for

    /**
     * @param {string} linePrefix
     */
    function getCommentBlock(linePrefix: string) {
        return `${commentBlockContents
            .map((line) => `${linePrefix} ${line}`)
            .join("\n")} \n`;
    }

    switch (language) {
        case "python":
            return `${getCommentBlock("#")}
import urllib.request
url = '${url.replace(/'/g, "\\'")}'
filename = '${filename}'
urllib.request.urlretrieve(url, filename)`;

        case "r":
            return `${getCommentBlock("#")}
url <- "${url.replace(/"/g, '\\"')}"
filename <- "${filename}"
download.file(url, destfile=filename)`;

        case "bash":
            return `${getCommentBlock("#")}
curl -LO ${url}`;

        case "web-access":
            return `${getCommentBlock("#")}
${url}`;

        default:
            throw new Error(`Language "${language}" not supported`);
    }
}

/**
 * Selects all text within target element
 *
 * @param {HTMLElement} element Target element to select text within
 */
function selectElementText(element: HTMLElement | null) {
    if (!element) {
        return;
    }

    // Go over the selection range
    const range = document.createRange();
    range.selectNodeContents(element);

    // Apply selection to the window
    const selection = window.getSelection();

    if (!selection) {
        return;
    }

    selection.removeAllRanges();
    selection.addRange(range);

    return selection;
}

/**
 * Generates Promise around handler for copying text to the clipboard
 *
 * @param {string} text Text to copy to clipboard (not guaranteed; see
 *        `copyTextToClipboard()`)
 *
 * @returns {Promise}
 */
function generateClipboardCopyPromise(text: string) {
    // Detect whether we can use the latest Clipboard API methods
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
    }

    // Use old `execCommand` based API
    // NOTE: Requires active selection in the window
    return new Promise<void>((resolve, reject) => {
        const success = document.execCommand("copy");
        if (success) {
            resolve();
        } else {
            reject();
        }
    });
}

/**
 * Copies text to clipboard
 *
 * Note that this will attempt to first use the Clipboard API with given text,
 * otherwise will fire a copy event which will only copy the last selected
 * text within the document.
 *
 * @param {string} text Text to copy to clipboard (not guaranteed; see notes)
 */
function copyTextToClipboard(text: string) {
    const textCopyPromise = generateClipboardCopyPromise(text);

    return textCopyPromise.catch(() => {
        // Alert when copy failed
        alert("Text was not copied; please copy manually");
    });
}

export interface Props {
    url: string;
    language: "python" | "r" | "bash" | "web-access";
    filename: string;
    publisher?: string;
    contact?: string;
    license?: string;
    landingPage?: string;
}

export default function GetDataCodeBlock({
    url,
    language,
    filename,
    publisher,
    contact,
    landingPage,
    license,
}: Props) {
    const snippetText = generateSnippetText(
        language,
        url,
        filename,
        publisher,
        contact,
        license,
        landingPage
    );

    // Creating a reference so that the actual <code> element may be
    // referred to for copying text
    const snippetTextElementRef = useRef<HTMLElement | null>(null);

    return (
        <div>
            <p>This code will download the file into your current directory.</p>
            <div>
                <Pre ref={snippetTextElementRef} style={{ overflow: "auto" }}>
                    {snippetText}
                </Pre>
            </div>
            <div>
                <Button
                    type="button"
                    className="float-right source"
                    onClick={(e) => {
                        selectElementText(snippetTextElementRef.current);
                        copyTextToClipboard(snippetText);
                        e.preventDefault();
                    }}
                    small
                    minimal
                    icon="clipboard"
                >
                    Copy
                </Button>
            </div>
        </div>
    );
}
