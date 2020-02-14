#!/bin/bash
cd ..
serverless invoke local --function classify 
serverless invoke local --function poll 

