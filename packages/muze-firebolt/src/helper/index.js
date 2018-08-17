import * as SELECTION from '../enums/selection';

export const initializeSideEffects = (context, sideEffects) => {
    const sideEffectsMap = context._sideEffects;

    sideEffects = sideEffects instanceof Array ? sideEffects : Object.values(sideEffects);
    sideEffects.forEach((SideEffect) => {
        const sideEffectInstance = sideEffectsMap[SideEffect.formalName()];
        sideEffectsMap[SideEffect.formalName()] = sideEffectInstance || new SideEffect(context);
    });
    return sideEffectsMap;
};

export const initializeBehaviouralActions = (context, actions) => {
    const dispatchableBehaviours = {};

    actions = actions instanceof Array ? actions : Object.values(actions);
    actions.forEach((Action) => {
        dispatchableBehaviours[Action.formalName()] = new Action(context);
    });
    return dispatchableBehaviours;
};

export const initializePhysicalActions = (context, actions) => {
    const physicalActions = {};

    for (const name in actions) {
        if (!({}).hasOwnProperty.call(name, actions)) {
            physicalActions[name] = actions[name](context);
        }
    }
    return physicalActions;
};

export const changeSideEffectAvailability = (sideEffects, fn, toEnable) => {
    for (const key in sideEffects) {
        if ({}.hasOwnProperty.call(sideEffects, key)) {
            let change = true;
            if (fn && fn(sideEffects[key], key) === false) {
                change = false;
            }
            if (change) {
                toEnable ? sideEffects[key].enable() : sideEffects[key].disable();
            }
        }
    }
};

export const getMergedSet = set => [...new Set([...set[0], ...set[1]])];

export const setSelectionSets = (addSet, selectionSet, persistent) => {
    if (addSet === null) {
        selectionSet.reset();
    } else if (addSet.length) {
            // new add set
        const existingAddSet = addSet.filter(d => selectionSet._set[d] === SELECTION.SELECTION_NEW_ENTRY
                || selectionSet._set[d] === SELECTION.SELECTION_OLD_ENTRY);

        // existing add set
        if (persistent) {
            if (existingAddSet.length) {
                selectionSet.updateExit();
                selectionSet.remove(existingAddSet);
            } else {
                selectionSet.updateEntry();
                selectionSet.add(addSet);
            }
            const { exitSet } = selectionSet.getSets();
            const mergedExitSet = getMergedSet(exitSet);
            if (exitSet[1].length !== selectionSet.getCompleteSetCount() &&
                    mergedExitSet.length === selectionSet.getCompleteSetCount()) {
                selectionSet.reset();
            }
        } else if (existingAddSet.length) {
            selectionSet.updateExit();
            const { entrySet } = selectionSet.getSets();

            selectionSet.reset(getMergedSet(entrySet));
            selectionSet.add(addSet);
            selectionSet.update(existingAddSet);
        } else {
            selectionSet.updateExit();
            const { entrySet } = selectionSet.getSets();
            selectionSet.reset(getMergedSet(entrySet));
            selectionSet.add(addSet);
        }
    } else {
        selectionSet.remove(selectionSet.getCompleteSet());
    }
};

export const getSourceFields = (propagationInf, criteria = {}) => {
    const sourceIdentifiers = propagationInf.sourceIdentifiers;
    let sourceFields;
    if (sourceIdentifiers) {
        sourceFields = sourceIdentifiers.getSchema().map(d => d.name);
    } else if (criteria instanceof Array) {
        sourceFields = criteria[0];
    } else {
        sourceFields = Object.keys(criteria || {});
    }
    return sourceFields;
};

export const getModelFromSet = (type, config) => {
    const { dataModel, set, propagationData } = config;
    const model = propagationData || dataModel;
    const conditionsMap = {
        newEntry: [SELECTION.SELECTION_NEW_ENTRY],
        oldEntry: [SELECTION.SELECTION_OLD_ENTRY],
        mergedEnter: [SELECTION.SELECTION_NEW_ENTRY, SELECTION.SELECTION_OLD_ENTRY],
        newExit: [SELECTION.SELECTION_NEW_EXIT],
        oldExit: [SELECTION.SELECTION_OLD_EXIT],
        mergedExit: [SELECTION.SELECTION_NEW_EXIT, SELECTION.SELECTION_OLD_EXIT],
        complete: [],
    };

    return model ? model.select((fields, i) => conditionsMap[type].some(condition => set[i] === condition), {
        saveChild: false
    }) : null;
};

export const getSetInfo = (type, set, config) => ({
    uids: set,
    length: set.length,
    model: config.isSourceFieldPresent === false ? config.filteredDataModel : getModelFromSet(type, config)
});