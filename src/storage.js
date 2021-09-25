export async function saveItem(key, value = null) {

    if (key === undefined) {
        return false;
    }

    try {
        console.log('====================================');
        const itemJsonString = JSON.stringify(value);
        await localStorage.setItem(key, itemJsonString);
        console.log('====================================');
    } catch (ex) {
        console.log('====================================');
        console.log('error storage-saveItem=> ', ex);
        console.log('====================================');
    }

}

export async function restoreItem(key) {

    if (key === undefined) {
        return false;
    }

    try {
        console.log('====================================');
        const item = await localStorage.getItem(key);
        console.log(`restore item for key ${key} => ${item}`);
        if (item === undefined) {
            return null;
        }
        const itemObject = JSON.parse(item);
        console.log(`restore itemObject for key ${key} => ${itemObject}`);
        console.log('====================================');
        return itemObject;
    } catch (ex) {
        console.log('====================================');
        console.log('error storage-restoreItem => ', ex);
        console.log('====================================');
    }

}
