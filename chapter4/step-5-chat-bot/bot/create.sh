#!/bin/bash
ROLE_EXISTS=`aws iam get-role --role-name AWSServiceRoleForLexBots | jq '.Role.RoleName == "AWSServiceRoleForLexBots"'`
if [ ! $ROLE_EXISTS ]
then
  aws iam create-service-linked-role --aws-service-name lex.amazonaws.com
fi

aws lex-models put-intent --name=CreateTodo --cli-input-json=file://create-todo-intent.json
aws lex-models put-intent --name=MarkDone --cli-input-json=file://mark-done-intent.json

aws lex-models put-bot --name=todo --cli-input-json=file://todo-bot.json

aws lex-models get-bot --name=todo --version-or-alias="\$LATEST"
