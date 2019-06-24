#!/bin/bash
cd ..
serverless invoke local --function translate --path ./invoke/input.json

