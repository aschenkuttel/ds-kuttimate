// ==UserScript==
// @name         DS-Kuttimate
// @version      1.0
// @description  A userscript to enhance the DS Ultimate attack planner with features like ignoring certain tribes, custom pagination, and sound notifications.
// @author       Knueppel-Kutte
// @include      https://ds-ultimate.de/tools/attackPlanner/*/edit/*
// @include      https://ds-ultimate.de/tools/attackPlanner/*/show/*
// @run-at       document-end
// ==/UserScript==


const config = {
    ignoredTribeIDs: [
        178, // GODS
        212, // UB
        805, // SB
        309, // 21:00
        316, // 21:00!
        613, // WaK
        663, // NiMa!
        649, // ZG
    ],
    paginationOptions: [
        200, // that's the maximum DS Ultimate allows
    ],
    customSounds: [
        {
            name: "Forza",
            url: "https://cdn.jsdelivr.net/gh/aschenkuttel/ds-kuttimate/sounds/forza.mp3"
        },
        {
            name: "Garmin",
            url: "https://cdn.jsdelivr.net/gh/aschenkuttel/ds-kuttimate/sounds/garmin.mp3"
        },
        {
            name: "Merkel",
            url: "https://cdn.jsdelivr.net/gh/aschenkuttel/ds-kuttimate/sounds/merkel.mp3"
        }
    ]
}


const baseUrl = "https://api.tw-connect.com"
let ignoredPlayers = {}
let ignoredLeastOneRow = false

async function updateIgnoredPlayers() {
    try {
        const response = await fetch(`${baseUrl}/player/de244`)

        if (!response.ok) {
            return
        }

        const rawData = await response.text()
        const data = JSON.parse(rawData)

        ignoredPlayers = {}
        for (const [playerID, playerData] of Object.entries(data)) {
            if (config.ignoredTribeIDs.includes(playerData.tribe_id)) {
                ignoredPlayers[playerID] = playerData
            }
        }

        localStorage.setItem('ds-kuttimate-ignored', JSON.stringify(ignoredPlayers))
        console.log(`Updated ignored players list with ${Object.keys(ignoredPlayers).length} players.`)
    } catch (error) {
        console.error("Error fetching player data:", error)
    }
}

function markIgnoredRows(rows) {
    let _ignoredLeastOneRow = false

    rows.forEach(row => {
        if (isRowIgnored(row)) {
            row.style.backgroundColor = "rgba(244, 0, 0, 0.25)" // light red
            _ignoredLeastOneRow = true
        }
    })

    ignoredLeastOneRow = _ignoredLeastOneRow
    const button = document.getElementById("selectIgnoredButton")

    if (!ignoredLeastOneRow) {
        button.classList.add("disabled")
        button.style.pointerEvents = "none"
    } else {
        button.classList.remove("disabled")
        button.style.pointerEvents = "auto"
    }
}

function isRowIgnored(row) {
    const playerLinks = row.querySelectorAll("a[href*='/player/']")

    if (playerLinks.length !== 2) {
        return
    }

    const defenderLink = playerLinks[1]
    const playerID = parseInt(defenderLink.href.split("/").pop())
    return ignoredPlayers[playerID] !== undefined
}

async function main() {
    console.log("DS-Kuttimate script loaded.")
    const rawPlayerIDs = localStorage.getItem('ds-kuttimate-ignored')

    if (!rawPlayerIDs) {
        console.log("No player IDs found in local storage, fetching from API.")
        await updateIgnoredPlayers()
    } else {
        ignoredPlayers = JSON.parse(rawPlayerIDs)
    }

    console.log(`Received ${Object.keys(ignoredPlayers).length} ignored playerIDs from ${config.ignoredTribeIDs.length} tribes.`)

    const attackTable = document.getElementById("data1")
    const dataWrapper = document.getElementById("data1_wrapper")
    const paginationSelector = document.getElementById("dt-length-0")

    for (const option of config.paginationOptions) {
        const optionElement = document.createElement("option")
        optionElement.value = option.toString()
        optionElement.textContent = option.toString()
        paginationSelector.appendChild(optionElement)
    }

    const audioTypeSelection = document.getElementById("audioTypeSelection")

    for (const sound of config.customSounds) {
        const optionElement = document.createElement("option")
        optionElement.value = sound.url
        optionElement.textContent = sound.name
        audioTypeSelection.appendChild(optionElement)
    }

    const dataWrapperHeader = dataWrapper.firstElementChild
    const dataWrapperHeaderSecondChild = dataWrapperHeader.children[1]

    const scriptIcon = document.createElement("img")
    scriptIcon.src = "https://gcdn.thunderstore.io/live/repository/icons/Hildebert-Drachenlord-1.0.0.png.128x128_q95.png"
    scriptIcon.style.width = "28.9px"
    scriptIcon.style.height = "28.9px"
    scriptIcon.style.marginRight = "8px"

    const selectIgnoredButton = document.createElement("button")
    selectIgnoredButton.id = "selectIgnoredButton"
    selectIgnoredButton.textContent = "Select Ignored"
    selectIgnoredButton.classList.add("btn", "btn-sm", "btn-secondary")
    selectIgnoredButton.style.height = "28.9px"
    selectIgnoredButton.style.marginRight = "5px"

    selectIgnoredButton.onclick = () => {
        const rows = attackTable.querySelectorAll("tbody tr")

        rows.forEach(row => {
            if (isRowIgnored(row)) {
                const checkboxCell = row.querySelector("td.select-checkbox")

                if (checkboxCell) {
                    checkboxCell.click()
                }
            }
        })
    }

    const updateButton = document.createElement("button")
    updateButton.textContent = "Refresh Ignore List"
    updateButton.classList.add("btn", "btn-sm", "btn-primary")
    updateButton.style.height = "28.9px"

    updateButton.onclick = async () => {
        updateButton.disabled = true
        updateButton.textContent = "Updating..."
        await updateIgnoredPlayers()
        updateButton.disabled = false
        updateButton.textContent = "Refresh Ignore List"
    }

    // span since ds ultimate starts to push their elements into my div lmao
    const scriptDiv = document.createElement("span")
    scriptDiv.style.display = "flex"

    scriptDiv.appendChild(scriptIcon)
    scriptDiv.appendChild(selectIgnoredButton)
    scriptDiv.appendChild(updateButton)

    // dataWrapperHeader.appendChild(scriptDiv)
    dataWrapperHeader.insertBefore(scriptDiv, dataWrapperHeaderSecondChild)

    const attackTbody = attackTable.getElementsByTagName('tbody')[0]
    const rows = attackTbody.querySelectorAll("tr")

    if (rows.length > 0) {
        markIgnoredRows(rows)
    }

    const observer = new MutationObserver(() => {
        const rows = attackTbody.querySelectorAll("tr")

        if (rows.length > 0) {
            markIgnoredRows(rows)
        }
    })

    observer.observe(attackTbody, {
        childList: true,
        subtree: false,
    })
}


if (document.title.includes("244")) {
    void main()
} else {
    console.log("DS-Kuttimate script only running on server 244.")
}