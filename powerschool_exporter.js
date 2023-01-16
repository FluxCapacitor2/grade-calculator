// ==UserScript==
// @name         PowerSchool exporter
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Exports PowerSchool grades in a format usable by FluxCapacitor2's grade calculator
// @author       FluxCapacitor2
// @match        https://*.powerschool.com/guardian/scores.html*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=powerschool.com
// @grant        none
// ==/UserScript==

document.body.innerHTML = `<button id="load-script">Copy JSON</button>` + document.body.innerHTML;
const btn = document.getElementById("load-script");
btn.addEventListener("click", (e) => {
    load();
});

let assignments = [];

function load() {
    assignments = [];
    const rows = document.querySelectorAll("#scoreTable tbody tr.ng-scope");
    for (const row of rows) {
        const category = row.querySelector(".categorycol").textContent.trim();
        const name = row.querySelector(".assignmentcol").textContent.trim();
        const score = row.querySelector(".score").textContent.trim().split("\n").filter((line) => line.trim() != "").map((line) => line.trim());
        const flags = Array.from(row.querySelectorAll(".codeCol div")).map((el) => el.classList.item(0).substring(3));
        let assignment = {};
        if (score.length == 1) {
            assignment.score = score[0];
            assignment.weighted = score[0];
        } else {
            assignment.score = score[0];
            assignment.weighted = score[1].substring(1, score[1].length - 1);
        }
        assignment.category = category;
        assignment.name = name;
        assignment.flags = flags;
        assignments.push(assignment);
    }
    console.log(assignments);
    navigator.clipboard.writeText(JSON.stringify(assignments));
}
