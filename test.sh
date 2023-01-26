#!/bin/bash
watch -c "curl http://localhost:3000/chain 2>/dev/null | jq"