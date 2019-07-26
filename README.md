```
docker-compose up
```

Worker

Single worker with one account that is the owner of the document store

Worker 

Multiple workers with accounts that are part of a multisig wallet controlling the document store to transact in parallel

Worker 

Single worker with one account that controls an enhanced document store to allow batch revoke

Worker

Multiple workers with accounts that are part of a multisig wallet controlling the enhanced document store to allow batch revoke in parallel


# CLI Interface

options
- network
- privateKey
- address (documentStore)
- pollingTime (= time between adding job)
- jobsQueueLimit (= max jobs processed within polling time)

```
node . createJob issue
```

```
node . createJob revoke
```

```
node . consumer issue --privateKey 0xabcd --address 0xabcd
```

```
node . consumer revoke --privateKey 0xabcd --address 0xabcd
```
