#!/bin/sh

sshpass -p $3 ssh -o StrictHostKeyChecking=no $2@$1 "$4"