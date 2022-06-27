const fs = require('fs');
const path= require('path');
const {promises} = require('fs');
const fsPromise = promises

//file related utils:
exports.loadFile = async function (path) {
    return await fsPromise.readFile(path, 'utf8');
}

exports.loadJSON = async function (path)  {
    let rawFile = await fsPromise.readFile(path, 'utf8');

    return JSON.parse(rawFile)
}


exports.readDir = async function (dir) {
    return (await fsPromise.readdir(dir)).map((f) => path.join(dir, f));
}

exports.writeJSONToFile = async function (fileName, obj) {
    return await fsPromise.writeFile(
        fileName,
        JSON.stringify(obj, null, 2),
        'utf8',
    );
}

exports.writeToFile = async function (fileName, str) {
    return await fsPromise.writeFile(fileName, str, 'utf8');
}

exports.readFilesInDir = async function (folderPath) {
    const convertPathToFileName = (path) => path.split('/').reverse()[0];
    const files = await readDir(folderPath);

    return await Promise.all(
        files.map(async (filePath) => {
            const fileContent = await loadFile(filePath);
            return {
                name: convertPathToFileName(filePath),
                content: fileContent,
            };
        }),
    );
}

exports.deleteFile = function (path_to_file) {
    fs.unlink(path_to_file, (err) => {
        if (err) throw err;
    });
}

exports.deleteAllFilesInFolder = function (path_to_folder) {
    fs.readdir(path_to_folder, (err, files) => {
        if (err) throw err;

        for (const file of files) {
            if (file !== '.gitignore') {
                exports.deleteFile(path.join(path_to_folder, file))
            }
        }
    });
};