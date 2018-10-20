const fs = require("fs");
const path = require("path");
const util = require("util");

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);


let isExecutable = ({fileStat}) => {
    let pUID = process.getuid();
    let pGIDs = process.getgroups();
    // create a comparison mask to see if anyone can exacute the file
    let comparisionMask = fs.constants.S_IXOTH;
    // If the owner of the file is the executing user add the exectable user
    // constant to the comparison mask
    if (fileStat.uid === pUID) {
        comparisionMask = comparisionMask | fs.constants.S_IXUSR;
    }
    // If the group of the file is in the users groups add the exectable group
    // constant to the comparision mask
    if (pGIDs.includes(fileStat.gid)) {
        comparisionMask = comparisionMask | fs.constants.S_IXGRP;
    }
    // Bitwise and the comparison mask against the current mode
    //  if the return value is zero then the file is not exectuable
    let resultMask = fileStat.mode & comparisionMask;
    if (resultMask === 0) {
        return false;
    }
    else {
        return true;
    }
};

let isHTML = ({name}) => {
    if (name.endsWith(".html")) {
        return true;
    }
};

let checkFile = async (dir, fileURL, checks) => {
    let results = [];
    let file = path.resolve(dir, fileURL);
    let fileStat = await stat(file);
    if (fileStat){
        if (fileStat.isDirectory()) {
            let res = await getMainFiles(file);
            results = results.concat(res);
            return results;
        }
        for (let check in checks) {
            if (check({file, fileStat}))
                results.push(file);
            return results;
        }
    }
};
let getMainFiles = async (dir) => {
    let checks = [isHTML, isExecutable];
    let results = [];
    let nodes = await readdir(dir);
    let pending = nodes.length;
    if (!pending) return results;
    for (let node of nodes) {
        let newResults = await checkFile(dir, node, checks);
        results.concat(newResults);
    }
};

let createTree = async (dir) => {
    let tree = {};
    let vaildFiles = await getMainFiles(dir);
    for (let file in vaildFiles) {
        console.log(file);
    }
    return vaildFiles;
};

module.exports = createTree;
