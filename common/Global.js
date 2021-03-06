export let global = {
    grouped : false,
    ungroupedWindows : [],
    favourities : [],
    groups: [],

    groupCreating : false,
    showDuplicates: false,

    selectedGroups: [],

    duplicateNumber : 0,

    groupedWindows : [],
    ungrSel : null,
    grSel : null,

    expandedHosts : [],
    
    numberOfDuplicates: null,

    settings : {
        pinTabOption : true,
        muteTabOption : true,
        openNewWindowOption : true,
        groupByDefaultOption : true,
        keepLastGroupingModeOption : false, 
        rememberLastGroupingModeOption : false,
    
        openAllInThisWindowOption : true,
        openAllInThisWindowAsGroupOption : true,
        openAllInNewWindowOption : true,
        openAllIncognitoOption : true,
        openTabInNewWindowOption : true,
        openTabIncognitoOption : true,
        rememberExpandedGroupsWebsite : true,
    
        displayAsGroupOption :  true,
        rememberLastDisplayModeOption : true,
        darkmodeOption :  true,
        keepLastOpenedSectionOption : false,

        previouslyGrouped : false
    }
}