// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract TodoList {
    struct Task {
        uint id;
        string content;
        bool completed;
    }

    mapping (uint => Task) public tasks;
    uint public taskCount;

    event TaskCreated (
        uint id,
        string content,
        bool completed
    );
        

    event TaskCompleted (
        uint id,
        bool completed
    );

    constructor() {
    }

    function createTask(string memory _content) public {
        taskCount++;
        tasks[taskCount] = Task(taskCount, _content, false);
        emit TaskCreated(taskCount, _content, false);
    }

    function toggleCompleted(uint _id) public {
        require(_id > 0 && _id <= taskCount, "Task ID does not exist.");
        Task storage task = tasks[_id];
        task.completed = !task.completed;
        emit TaskCompleted(_id, task.completed);
    }
}