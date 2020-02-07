#!/bin/bash

mkdir -p data
cd data 

curl http://snap.stanford.edu/data/amazon/productGraph/categoryFiles/reviews_Automotive_5.json.gz --output reviews_Automotive_5.json.gz
gunzip reviews_Automotive_5.json.gz

curl http://snap.stanford.edu/data/amazon/productGraph/categoryFiles/reviews_Office_Products_5.json.gz --output reviews_Office_Products_5.json.gz
gunzip reviews_Office_Products_5.json.gz

curl http://snap.stanford.edu/data/amazon/productGraph/categoryFiles/reviews_Beauty_5.json.gz --output reviews_Beauty_5.json.gz
gunzip reviews_Beauty_5.json.gz

curl http://snap.stanford.edu/data/amazon/productGraph/categoryFiles/reviews_Pet_Supplies_5.json.gz --output reviews_Pet_Supplies_5.json.gz
gunzip reviews_Pet_Supplies_5.json.gz

