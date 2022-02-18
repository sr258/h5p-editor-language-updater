import fs from "fs";
import path from "path";
import prettier from "prettier";
import chalk from "chalk";
import { exit } from "process";

let currentLng = "";
let addCount = 0;
let removeCount = 0;

const deleteEntries = (template, target) => {
  if (!target) return;
  for (const property of Object.keys(target)) {
    if (!template[property]) {
      removeCount++;
      delete target[property];
      continue;
    }
    if (typeof target[property] === "object") {
      deleteEntries(template[property], target[property]);
    }
  }
};

const addEntries = (template, target) => {
  for (const property of Object.keys(template)) {
    if (!target[property]) {
      target[property] = template[property];
      addCount++;
    } else {
      if (typeof template[property] === "object") {
        if (typeof target[property] !== "object") {
          target[property] = template[property];
        } else {
          addEntries(template[property], target[property]);
        }
      }
    }
  }
};

global.H5PEditor = {
  language: {},
};

const run = async () => {
  const basePath = process.argv[2];
  if (!basePath) {
    console.log("You must specify a path to the language directory.");
    console.log("Example: node index.js ../h5p-editor-php-library/language");
    exit(1);
  }
  const files = fs.readdirSync(path.resolve(basePath));
  await import(path.resolve(basePath, "en.js"));
  const base = global.H5PEditor.language.core;

  for (const file of files) {
    if (file === "en.js") {
      continue;
    }
    console.log(chalk.yellow(file));
    currentLng = file.replace(".js", "");
    await import(path.resolve(basePath, file));
    const obj = global.H5PEditor.language.core;
    addCount = 0;
    removeCount = 0;
    deleteEntries(base, obj);
    addEntries(base, obj);
    console.log(
      chalk.blue(currentLng),
      "Deleted",
      chalk.red(removeCount),
      "and added",
      chalk.green(addCount),
      "strings"
    );

    const reserializedObj = JSON.stringify(obj);
    const js = `H5PEditor.language.core =${reserializedObj};`;
    const formatted = prettier.format(js, {
      parser: "babel",
      singleQuote: true,
      tabWidth: 2,
      printWidth: 120,
    });
    fs.writeFileSync(path.resolve(basePath, file), formatted);
  }
};
run();
