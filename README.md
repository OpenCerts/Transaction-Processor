# Transaction Processor

This project tests the upper limit of the number of transactions that a single OpenAttestation [DocumentStore](https://github.com/OpenCerts/certificate-store-contract) can take. The project make use of a rabbitmq server to queue the jobs. There are two main component to the project, a `Job Creator` and a `Job Processor`.

## RabbitMQ Server

The rabbitmq server is used as the queue manager for the ISSUE and REVOKE jobs. A docker-compose file is created in the root directory for launching the rabbitmq server.

The management console is available at `http://localhost:15672` and the username and password are `rabbitmq`.

To run the rabbitmq server:

```
docker-compose up -d
```

## Job Creator

The role of the Job Creator is to create ISSUE/REVOKE jobs in the rabbitmq server. While it's role is to create as many jobs, it does not flood the queue with excessive number of jobs.

It constantly polls the rabbitmq management server at the interval `pollingTime` (in milliseconds) to check if the number of jobs fall below `queueLimit`.

Therefore, the maximum flow rate of jobs into the queue is simply `queueLimit * 1000/pollingTime` jobs per second.

To run the Job Creator to create jobs in ISSUE queue:

```
DEBUG=producer* node . createJobs ISSUE
```

To run the Job Creator to create jobs in REVOKE queue:

```
DEBUG=producer* node . createJobs REVOKE
```

## Job Processor

The role of the Job Processor is to process the job queues. It takes a job and send create a corresponding Ethereum transaction to issue or revoke the hash.

The job processor can choose to either wait for a transaction to be mined before moving to the next or move on to another transaction once the previous has been received by an Ethereum node. By allowing the job processor to not wait for the previous transaction to be mined, multiple transactions can be processed in a single block. However, there is no confirmation that the transaction will eventually be processed by the node - the transaction can be dropped.

The Job Processor comes in two flavors, `SimpleWallet` and `MultisigWallet`:

### SimpleWallet

In the `SimpleWallet` mode, the private key provided to the CLI is for the account owned the DocumentStore directly. ISSUE & REVOKE transactions are sent directly to the DocumentStore smart contract. In this mode, only one instance of the wallet is allowed to process the job queue.

To run the Job Processor to ISSUE documents:

```
DEBUG=consumer* node . processJobs ISSUE \
    <DOCUMENT STORE ADDRESS> \
    <PRIVATE KEY>
```

To run the Job Processor to REVOKE documents:

```
DEBUG=consumer* node . processJobs REVOKE \
    <DOCUMENT STORE ADDRESS> \
    <PRIVATE KEY>
```

### MultisigWallet

In the `MultisigWallet` mode, the private key provided to the CLI is for the account that is allowed to send transactions to a [Gnosis Multisig Wallet](https://github.com/gnosis/MultiSigWallet) instance. ISSUE & REVOKE transactions are instead sent to the multisig wallet to be processed. In this mode, we can add many different wallets to the same multisig wallet (with 1 required confirmation) to allow many different wallets to ISSUE and REVOKE documents at the same time. Parallel processing yay!

To run the Job Processor to ISSUE documents:

```
DEBUG=consumer* node . processJobs ISSUE \
    <DOCUMENT STORE ADDRESS> \
    <PRIVATE KEY> \
    <MULTISIG WALLET ADDRESS>
```

To run the Job Processor to REVOKE documents:

```
DEBUG=consumer* node . processJobs REVOKE \
    <DOCUMENT STORE ADDRESS> \
    <PRIVATE KEY> \
    <MULTISIG WALLET ADDRESS>
```

### Resources

OpenAttestation DocumentStore Admin Panel - [admin.opencerts.io](https://admin.opencerts.io)
Gnosis Multisig Wallet Admin Panel - [wallet.gnosis.pm](https://wallet.gnosis.pm)
