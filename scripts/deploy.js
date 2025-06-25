const hre = require("hardhat");

async function main() {
    const TodoList = await hre.ethers.getContractFactory("TodoList");

    const todoList = await TodoList.deploy();

    await todoList.waitForDeployment();

    console.log('TodoList contract deployed to: &{todoList.target}');

    console.log("Creating initial task..");
    const tx1 = await todoList.createTask("Learn hardhat & solidity");
    await tx1.wait();
    console.log("Task 'Learn hardhat & solidity' created.");

    console.log("Creating second task...");
    const tx2 = await todoList.createTask("Build a Dapp Frontend");
    await tx2.wait();
    console.log("Task 'Build a Dapp Frontend' created.")

    console.log("Toggling completion of task 1...");
    const tx3 = await todoList.toggleCompleted(1);
    await tx3.wait();
    console.log("Task 1 completion toggled.");

    const task1 = await todoList.tasks(1);
    console.log(`Task 1: ID=<span class="math-inline">\{task1\.id\}, Content\='</span>{task1.content}', Completed=${task1.completed}`);

    const task2 = await todoList.tasks(2);
    console.log(`Task 2: ID=<span class="math-inline">\{task2\.id\}, Content\='</span>{task2.content}', Completed=${task2.completed}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
})