const { request, response } = require("express");
const express = require("express");
const {v4: uuidv4} = require("uuid");

const app = express();

app.use(express.json());

const customers = [];

//middleware

function verifyIfExistsAccountCPF(request, response, next){
    const {cpf} = request.headers;

    const customer = customers.find(customer => customer.cpf === cpf);

    if (!customer) {
        return response.status(400).json({error: "Customer not found"});
    }

    //passar customer para as demais rotas que estao cnsumindo

    request.customer = customer;

    return next();

}

function getBalance(statement){
    //reduce operação de soma do js
    //acc variavel que armazena todos os valores a serem somados
  const balance =  statement.reduce((acc, operation)=>{
     if(operation.type === 'credit') {
         return acc + operation.amount;
     }else{
         return acc - operation.amount;
     }
     //0 valor inicial do reduce
    },0);

    return balance;
}

app.post("/account", (request, response) => {
    const {cpf, name} = request.body;

    const customerAlreadyExists = customers.some(
        (customer) => customer.cpf === cpf
    );

    if (customerAlreadyExists) {
        return response.status(400).json({error: "Customer already exists!"});
    }

   
    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: []
    });

  return response.status(201).send();
});

//outra forma de chamar o middleware usar quando todas as rotas a seguir irão utilizar esse middleware
//app.use(verifyIfExistsAccountCPF);

app.get("/statement", verifyIfExistsAccountCPF,(request,response) =>{
    //const {cpf} = request.params;

    //const {cpf} = request.headers;

    //const customer = customers.find(customer => customer.cpf === cpf);

    //if (!customer) {
       // return response.status(400).json({error: "Customer not found"});
 //  }


 //buscar customer passado no middleware

 const {customer} = request;

    return response.json(customer.statement);

});


app.post("/deposit", verifyIfExistsAccountCPF,(request,response) =>{
    const {description, amount} = request.body;

    const { customer } = request;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    customer.statement.push(statementOperation);

return response.status(201).send();
});

app.post("/withdraw", verifyIfExistsAccountCPF, (request, response)=>{
const {amount} = request.body;

const {customer} = request;

//customer.statement onde fica todas as movimentações de credito e debito
const balance = getBalance(customer.statement);

if(balance < amount) {
    return response.status(400).json({error: "Insufficient funds!"})
}

const statementOperation = {
    amount,
    created_at: new Date(),
    type:"debit",
};

customer.statement.push(statementOperation);

return response.status(201).send();
});

app.get("/statement/date", verifyIfExistsAccountCPF,(request,response) =>{


 const {customer} = request;
 const {date} = request.query;

//para buscar a data indepente do horario
 const dateFormat = new Date(date + " 00:00");

 const statement = customer.statement.filter(
     (statement) => statement.created_at.toDateString() === 
     new Date (dateFormat).toDateString()
     );


    return response.json(statement);

});

app.put("/account", verifyIfExistsAccountCPF,(request, response) =>{
  const {name} = request.body;
  const {customer} = request;

  customer.name = name;

  return response.status(201).send();
});

app.get("/account", verifyIfExistsAccountCPF, (request, response)=>{
 
    const {customer} = request;

    return response.json(customer);

});

app.delete("/account", verifyIfExistsAccountCPF, (request, response)=>{

    const {customer} = request;

    //splice metodo de delete (recebe dois paramentros (onde começa e onde termina a remoção))
    //1 remove apenas uma posição(conta)
    customers.splice(customer, 1);

    //retornar as contas que restaram
    return response.status(200).json(customers);


});

//retorna o saldo da conta
app.get("/balance", verifyIfExistsAccountCPF, (request,response)=>{
  const {customer} = request;

  const balance = getBalance(customer.statement);

  return response.json(balance);

});

app.listen(4040);