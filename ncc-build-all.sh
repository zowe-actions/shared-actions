#!/bin/sh

# This script iterates through all sub actions and run ncc command to compile and build javascript

# install ncc if not done so
out="$(ncc 2>&1 > /dev/null)"
if [[ "$out" == *"ncc: command not found"* ]]; then
  npm i -g @vercel/ncc 
fi

for file in $(find . -type f -name "index.js" -maxdepth 2)
do
    cd $(echo $file | cut -d'/' -f 2)
    ncc build index.js --license licenses.txt
    cd ..
done


