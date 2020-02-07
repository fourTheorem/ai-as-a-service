#!/bin/bash
aws lex-models delete-bot --name=todo
sleep 10
aws lex-models delete-intent --name=CreateTodo
aws lex-models delete-intent --name=MarkDone

