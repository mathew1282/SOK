// =====================================
// LINIE
// - teren: Szlak / Osobowa / Towarowa
// - stacjonarny: Dyżurny zmiany / Komendant
// Soft Pastel + kolory UI pod tryb jasny i ciemny
// =====================================

let liniePatrolModes = {};
let liniePersonRoles = {};

function initLinie() {
    if (!appState.linie) {
        appState.linie = {
            szlak: "",
            osobowa: "",
            towarowa: "",
            dyzurny: "",
            komendant: ""
        };
    }
    if (appState.linie.dyzurny === undefined) appState.linie.dyzurny = "";
    if (appState.linie.komendant === undefined) appState.linie.komendant = "";
    renderLinie();
}

function renderLinie() {
    const container = document.getElementById("linieContainer");
    if (!container) return;

    const today = new Date().toLocaleDateString("pl-PL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });

    const patrole = appState.patrole || [];

    const fieldBox = (label, key, placeholder, accent) => `
        <div style="flex:1; min-width:160px; background:var(--bg-input); border:1px solid var(--border); border-radius:12px; padding:14px; border-top:3px solid ${accent};">
            <div style="font-size:13px; color:var(--text-dim); margin-bottom:8px; font-weight:600;">${label}</div>
            <input type="text"
                   value="${escapeHtml(appState.linie?.[key] || "")}"
                   onchange="saveLine('${key}', this.value)"
                   placeholder="${placeholder}"
                   style="width:100%; padding:10px 12px; font-size:15px; color:var(--text); background:var(--bg-light); border:1px solid var(--border); border-radius:8px;">
        </div>
    `;

    let html = `
    <div class="card">
        <h2 style="margin-bottom:20px;">Linie</h2>

        <!-- Rząd 1: Szlak | Osobowa | Towarowa -->
        <div style="display:flex; flex-wrap:wrap; gap:12px; margin-bottom:12px;">
            ${fieldBox("Szlak", "szlak", "np. 274", "#60a5fa")}
            ${fieldBox("Osobowa", "osobowa", "np. 275", "#34d399")}
            ${fieldBox("Towarowa", "towarowa", "np. 276", "#fb923c")}
        </div>

        <!-- Rząd 2: Dyżurny | Komendant -->
        <div style="display:flex; flex-wrap:wrap; gap:12px; margin-bottom:28px;">
            ${fieldBox("Dyżurny zmiany", "dyzurny", "nr linii dyżurnego", "#a78bfa")}
            ${fieldBox("Komendant", "komendant", "nr linii komendanta", "#f472b6")}
        </div>

        <h3 style="margin-bottom:12px;">Patrole</h3>
    `;

    if (patrole.length === 0) {
        html += `<p style="color:var(--text-dim); margin-bottom:24px;">Brak patroli – dodaj je w zakładce Patrole.</p>`;
    } else {
        html += `<div style="display:flex; flex-wrap:wrap; gap:12px; margin-bottom:28px;">`;

        patrole.forEach((patrol, index) => {
            const mode = liniePatrolModes[index] || "";
            const people = getPatrolPeopleList(patrol);
            const nazwa = patrol.nazwa || ("Patrol " + (index + 1));

            html += `
            <div style="flex:1; min-width:260px; background:var(--bg-input); border:1px solid var(--border); border-radius:12px; padding:14px;">
                <div style="font-weight:700; margin-bottom:10px; color:var(--text);">${escapeHtml(nazwa)}</div>
                <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
                    <button type="button" class="btn-primary"
                        style="${mode === "teren" ? "background:var(--primary); outline:2px solid var(--primary-light);" : "background:var(--border-mid);"}"
                        onclick="setLiniePatrolMode(${index}, 'teren')">Teren</button>
                    <button type="button" class="btn-primary"
                        style="${mode === "stacjonarny" ? "background:var(--primary); outline:2px solid var(--primary-light);" : "background:var(--border-mid);"}"
                        onclick="setLiniePatrolMode(${index}, 'stacjonarny')">Stacjonarny</button>
                    <button type="button" class="btn-danger"
                        style="background:var(--border-mid);"
                        onclick="setLiniePatrolMode(${index}, '')">Wyczyść</button>
                </div>
            `;

            if (mode === "stacjonarny") {
                if (people.length === 0) {
                    html += `<p style="color:var(--danger-light); font-size:13px;">Brak osób w składzie.</p>`;
                } else {
                    people.forEach(personName => {
                        const key = personRoleKey(index, personName);
                        const role = liniePersonRoles[key] || "";
                        html += `
                        <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center; padding:8px; background:var(--bg-light); border:1px solid var(--border); border-radius:8px; margin-bottom:6px; color:var(--text);">
                            <span style="flex:1; min-width:120px; font-size:13px; font-weight:600; color:var(--text);">${escapeHtml(personName)}</span>
                            <button type="button" class="btn-primary"
                                style="${role === "komendant" ? "background:#f472b6; outline:2px solid #f9a8d4;" : "background:var(--border-mid);"}"
                                onclick="setLiniePersonRole(${index}, '${escapeAttr(personName)}', 'komendant')">Komendant</button>
                            <button type="button" class="btn-primary"
                                style="${role === "dyzurny" ? "background:#a78bfa; outline:2px solid #c4b5fd;" : "background:var(--border-mid);"}"
                                onclick="setLiniePersonRole(${index}, '${escapeAttr(personName)}', 'dyzurny')">Dyżurny</button>
                        </div>`;
                    });
                }
            } else if (mode === "teren") {
                html += `<p style="color:var(--text-dim); font-size:13px; margin:0;">Szlak + Osobowa + Towarowa dla całego składu</p>`;
            }

            html += `</div>`;
        });

        html += `</div>`;
    }

    html += `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
            <h3 style="margin:0;">Tabele do Excela</h3>
            <button onclick="copyAllTables()" class="btn-primary">📋 Kopiuj do Excela</button>
        </div>
        <div id="linieTablesArea">
    `;

    const tablesHtml = buildAllPersonTables(today);
    if (!tablesHtml) {
        html += `<p style="color:var(--text-dim);">Wybierz tryb patrolu powyżej, aby wygenerować tabele.</p>`;
    } else {
        html += tablesHtml;
    }

    html += `
        </div>
    </div>`;

    container.innerHTML = html;
}

function escapeHtml(str) {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function escapeAttr(str) {
    return String(str || "")
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, "&quot;");
}

function personRoleKey(patrolIndex, personName) {
    return patrolIndex + "|" + personName;
}

function getPatrolPeopleList(patrol) {
    const set = new Set();
    if (Array.isArray(patrol.sklad)) {
        patrol.sklad.forEach(n => { if (n && String(n).trim()) set.add(String(n).trim()); });
    }
    if (patrol.dowodca && String(patrol.dowodca).trim()) set.add(String(patrol.dowodca).trim());
    if (patrol.kierowca && String(patrol.kierowca).trim()) set.add(String(patrol.kierowca).trim());
    return Array.from(set);
}

function getNrPLK(fullName) {
    if (!appState.dane || !appState.dane.rows) return "";
    for (let row of appState.dane.rows) {
        const rowName = `${row["Stopień"] || ""} ${row["Nazwisko"] || ""} ${row["Imię"] || ""}`.trim();
        const shortName = `${row["Nazwisko"] || ""} ${row["Imię"] || ""}`.trim();
        if (rowName === fullName || shortName === fullName) {
            return row["NrPLK"] || row["Nr PLK"] || row["NrPLK "] || "";
        }
    }
    return "";
}

function setLiniePatrolMode(index, mode) {
    if (mode) liniePatrolModes[index] = mode;
    else delete liniePatrolModes[index];
    renderLinie();
}

function setLiniePersonRole(patrolIndex, personName, role) {
    const key = personRoleKey(patrolIndex, personName);
    if (liniePersonRoles[key] === role) delete liniePersonRoles[key];
    else liniePersonRoles[key] = role;
    renderLinie();
}

// Kolejność tabel: 1) Komendant  2) Dyżurny  3) Teren (wg patroli)
function buildAllPersonTables(today) {
    const patrole = appState.patrole || [];
    const komendantParts = [];
    const dyzurnyParts = [];
    const terenParts = [];

    patrole.forEach((patrol, index) => {
        const mode = liniePatrolModes[index];
        if (!mode) return;

        const people = getPatrolPeopleList(patrol);
        if (people.length === 0) return;

        people.forEach(personName => {
            const person = {
                fullName: personName,
                nrPLK: getNrPLK(personName)
            };

            if (mode === "teren") {
                terenParts.push(createPersonTableTeren(person, today));
            } else if (mode === "stacjonarny") {
                const key = personRoleKey(index, personName);
                const role = liniePersonRoles[key];
                if (!role) return;
                if (role === "komendant") {
                    komendantParts.push(createPersonTableStacjonarny(person, today, role));
                } else if (role === "dyzurny") {
                    dyzurnyParts.push(createPersonTableStacjonarny(person, today, role));
                }
            }
        });
    });

    const all = [...komendantParts, ...dyzurnyParts, ...terenParts];
    return all.length ? all.join("") : "";
}

function createPersonTableTeren(person, today) {
    // Soft Pastel – mocniejsze odcienie pod biały tekst w Excelu
    const rows = [
        { bg: "#3b82f6", line: appState.linie?.szlak || "" },   // Szlak
        { bg: "#10b981", line: appState.linie?.osobowa || "" }, // Osobowa
        { bg: "#f97316", line: appState.linie?.towarowa || "" } // Towarowa
    ];

    let body = rows.map(r => `
        <tr style="background:${r.bg}; color:#ffffff;">
            <td style="padding:12px; border:1px solid #475569; font-weight:bold; text-align:center; width:15%; color:#ffffff;">${escapeHtml(person.nrPLK)}</td>
            <td style="padding:12px; border:1px solid #475569; color:#ffffff;">${escapeHtml(r.line)}</td>
            <td style="padding:12px; border:0 solid #475569; color:#ffffff;"></td>
            <td style="padding:12px; border:0 solid #475569; color:#ffffff;"></td>
            <td style="padding:12px; border:0 solid #475569; color:#ffffff;"></td>
            <td style="padding:12px; border:0 solid #475569; color:#ffffff;"></td>
            <td style="padding:12px; border:1px solid #475569; text-align:center; width:15%; color:#ffffff;">${today}</td>
            <td style="padding:12px; border:1px solid #475569; color:#ffffff;" contenteditable="true"></td>
        </tr>
    `).join("");

    return `
    <div style="margin-bottom:20px;">
        <div style="background:var(--border-mid); color:var(--text); padding:12px 16px; font-size:16px; font-weight:700; border-radius:8px 8px 0 0; border:1px solid var(--border); border-bottom:none;">
            ${escapeHtml(person.fullName)} <span style="font-size:12px; font-weight:500; color:var(--text-dim);">(teren)</span>
        </div>
        <table class="excelSubTable" style="width:100%; border-collapse:collapse; border:2px solid var(--border); background:transparent;">
            <tbody>${body}</tbody>
        </table>
    </div>`;
}

function createPersonTableStacjonarny(person, today, role) {
    const isDyzurny = role === "dyzurny";
    const lineNum = isDyzurny ? (appState.linie?.dyzurny || "") : (appState.linie?.komendant || "");
    const roleLabel = isDyzurny ? "Dyżurny zmiany" : "Komendant";
    const bg = isDyzurny ? "#8b5cf6" : "#ec4899";

    return `
    <div style="margin-bottom:20px;">
        <div style="background:var(--border-mid); color:var(--text); padding:12px 16px; font-size:16px; font-weight:700; border-radius:8px 8px 0 0; border:1px solid var(--border); border-bottom:none;">
            ${escapeHtml(person.fullName)} <span style="font-size:12px; font-weight:500; color:var(--text-dim);">(stacjonarny – ${roleLabel})</span>
        </div>
        <table class="excelSubTable" style="width:100%; border-collapse:collapse; border:2px solid var(--border); background:transparent;">
            <tbody>
                <tr style="background:${bg}; color:#ffffff;">
                    <td style="padding:12px; border:1px solid #475569; font-weight:bold; text-align:center; width:15%; color:#ffffff;">${escapeHtml(person.nrPLK)}</td>
                    <td style="padding:12px; border:1px solid #475569; color:#ffffff;">${escapeHtml(lineNum)}</td>
                    <td style="padding:12px; border:0 solid #475569; color:#ffffff;"></td>
                    <td style="padding:12px; border:0 solid #475569; color:#ffffff;"></td>
                    <td style="padding:12px; border:0 solid #475569; color:#ffffff;"></td>
                    <td style="padding:12px; border:0 solid #475569; color:#ffffff;"></td>
                    <td style="padding:12px; border:1px solid #475569; text-align:center; width:15%; color:#ffffff;">${today}</td>
                    <td style="padding:12px; border:1px solid #475569; color:#ffffff;" contenteditable="true"></td>
                </tr>
            </tbody>
        </table>
    </div>`;
}

function saveLine(type, value) {
    if (!appState.linie) appState.linie = {};
    appState.linie[type] = value.trim();
    saveState();
    renderLinie();
}

function copyAllTables() {
    const tables = document.querySelectorAll(".excelSubTable");
    if (tables.length === 0) {
        alert("Brak tabel do skopiowania. Wybierz tryb patrolu i (dla stacjonarnego) role osób.");
        return;
    }

    let combinedText = "";
    tables.forEach((table) => {
        const rows = table.querySelectorAll("tr");
        rows.forEach(row => {
            const cells = row.querySelectorAll("td");
            const rowData = Array.from(cells).map(cell => cell.innerText.trim());
            combinedText += rowData.join("\t") + "\n";
        });
    });

    navigator.clipboard.writeText(combinedText.trim()).then(() => {
        if (typeof showToast === "function") showToast("✅ Skopiowano do Excela");
        else alert("✅ Skopiowano – wklej (Ctrl+V)");
    }).catch(() => {
        alert("Nie udało się skopiować automatycznie.");
    });
}

window.saveLine = saveLine;
window.copyAllTables = copyAllTables;
window.setLiniePatrolMode = setLiniePatrolMode;
window.setLiniePersonRole = setLiniePersonRole;
window.initLinie = initLinie;
