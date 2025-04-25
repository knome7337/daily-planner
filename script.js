// Global variables
let tasks = [];
let settings = {
    blockDuration: 30,
    startTime: '09:00',
    endTime: '17:00',
    priorityColors: {
        1: '#ff4444',
        2: '#ffbb33',
        3: '#00C851'
    },
    priorityEmojis: {
        1: '🔥',
        2: '⭐',
        3: '🌱'
    },
    isDarkMode: false
};

// DOM Elements
const welcomeModal = document.getElementById('welcomeModal');
const settingsModal = document.getElementById('settingsModal');
const taskInput = document.getElementById('taskInput');
const prioritySelect = document.getElementById('prioritySelect');
const taskCategory = document.getElementById('taskCategory');
const taskStartTime = document.getElementById('taskStartTime');
const taskEndTime = document.getElementById('taskEndTime');
const taskNotes = document.getElementById('taskNotes');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const timeBlocks = document.getElementById('timeBlocks');
const currentDate = document.getElementById('currentDate');
const settingsBtn = document.getElementById('settingsBtn');
const resetBtn = document.getElementById('resetBtn');
const startMeditationBtn = document.getElementById('startMeditation');
const skipMeditationBtn = document.getElementById('skipMeditation');
const timer = document.getElementById('timer');
const toggleThemeBtn = document.getElementById('toggleTheme');

// Initialize the app
function init() {
    loadSettings();
    updateCurrentDate();
    showWelcomeModal();
    generateTimeBlocks();
    setupEventListeners();
}

// Load settings from localStorage
function loadSettings() {
    const savedSettings = localStorage.getItem('plannerSettings');
    if (savedSettings) {
        settings = JSON.parse(savedSettings);
        applySettings();
    }
}

// Save settings to localStorage
function saveSettings() {
    localStorage.setItem('plannerSettings', JSON.stringify(settings));
    applySettings();
    settingsModal.style.display = 'none';
}

// Apply current settings
function applySettings() {
    // Apply theme
    document.body.classList.toggle('dark-mode', settings.isDarkMode);
    
    // Apply priority colors
    document.documentElement.style.setProperty('--priority1-color', settings.priorityColors[1]);
    document.documentElement.style.setProperty('--priority2-color', settings.priorityColors[2]);
    document.documentElement.style.setProperty('--priority3-color', settings.priorityColors[3]);
    
    // Update time blocks
    generateTimeBlocks();
}

// Update current date display
function updateCurrentDate() {
    const now = new Date();
    currentDate.textContent = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Show welcome modal with meditation timer
function showWelcomeModal() {
    welcomeModal.style.display = 'block';
}

// Start meditation timer
function startMeditation() {
    let timeLeft = 300; // 5 minutes in seconds
    const timerInterval = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            welcomeModal.style.display = 'none';
        }
        timeLeft--;
    }, 1000);
}

// Generate time blocks based on settings
function generateTimeBlocks() {
    timeBlocks.innerHTML = '';
    
    const start = new Date(`2000-01-01T${settings.startTime}`);
    const end = new Date(`2000-01-01T${settings.endTime}`);
    const blockDuration = settings.blockDuration;
    
    let currentTime = new Date(start);
    
    while (currentTime < end) {
        const timeBlock = document.createElement('div');
        timeBlock.className = 'time-block';
        
        const timeLabel = document.createElement('div');
        timeLabel.className = 'time-label';
        timeLabel.textContent = currentTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        
        const timeContent = document.createElement('div');
        timeContent.className = 'time-content';
        
        timeBlock.appendChild(timeLabel);
        timeBlock.appendChild(timeContent);
        timeBlocks.appendChild(timeBlock);
        
        currentTime.setMinutes(currentTime.getMinutes() + blockDuration);
    }
}

// Add a new task
function addTask() {
    const task = {
        id: Date.now(),
        text: taskInput.value,
        priority: parseInt(prioritySelect.value),
        category: taskCategory.value,
        startTime: taskStartTime.value,
        endTime: taskEndTime.value,
        notes: taskNotes.value
    };
    
    if (validateTask(task)) {
        tasks.push(task);
        updateTaskDisplay();
        clearTaskInput();
    }
}

// Validate task input
function validateTask(task) {
    if (!task.text) {
        alert('Please enter a task description');
        return false;
    }
    
    if (!task.startTime || !task.endTime) {
        alert('Please enter start and end times');
        return false;
    }
    
    const start = new Date(`2000-01-01T${task.startTime}`);
    const end = new Date(`2000-01-01T${task.endTime}`);
    
    if (end <= start) {
        alert('End time must be after start time');
        return false;
    }
    
    return true;
}

// Update task display in time blocks
function updateTaskDisplay() {
    // Update task list
    taskList.innerHTML = '';
    tasks.forEach(task => {
        const taskElement = createTaskListElement(task);
        taskList.appendChild(taskElement);
    });

    // Update time blocks
    const timeBlockElements = document.querySelectorAll('.time-block');
    timeBlockElements.forEach(block => {
        const content = block.querySelector('.time-content');
        if (content) {
            content.innerHTML = '';
        }
    });
    
    // Add tasks to appropriate time blocks
    tasks.forEach(task => {
        const taskStart = convertTimeStringToDate(task.startTime);
        const taskEnd = convertTimeStringToDate(task.endTime);
        
        timeBlockElements.forEach(block => {
            const timeLabel = block.querySelector('.time-label').textContent;
            const blockTime = convertTimeStringToDate(timeLabel);
            const blockEndTime = new Date(blockTime.getTime() + settings.blockDuration * 60000);
            
            const content = block.querySelector('.time-content');
            if (content && isTimeInRange(blockTime, taskStart, taskEnd)) {
                const taskElement = createTaskElement(task);
                content.appendChild(taskElement);
            }
        });
    });
}

function convertTimeStringToDate(timeString) {
    // Handle both "HH:mm" format and "h:mm AM/PM" format
    let hours, minutes, isPM;
    
    if (timeString.includes(':')) {
        if (timeString.includes('AM') || timeString.includes('PM')) {
            // Parse "h:mm AM/PM" format
            const [time, period] = timeString.split(' ');
            [hours, minutes] = time.split(':').map(Number);
            isPM = period === 'PM';
            
            if (isPM && hours !== 12) {
                hours += 12;
            }
            if (!isPM && hours === 12) {
                hours = 0;
            }
        } else {
            // Parse "HH:mm" format
            [hours, minutes] = timeString.split(':').map(Number);
        }
    } else {
        // Default to start of day if invalid format
        hours = 0;
        minutes = 0;
    }
    
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
}

function isTimeInRange(blockTime, startTime, endTime) {
    return blockTime >= startTime && blockTime < endTime;
}

function createTaskListElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = `task-list-item priority-${task.priority}`;
    
    const emoji = settings.priorityEmojis[task.priority];
    const color = settings.priorityColors[task.priority];
    
    taskElement.innerHTML = `
        <div class="task-list-header">
            <span class="priority-emoji">${emoji}</span>
            <span class="task-text">${task.text}</span>
            <button class="delete-task" data-id="${task.id}">×</button>
        </div>
        <div class="task-list-details">
            <span class="task-category">${task.category || ''}</span>
            <span class="task-time">${formatTime(task.startTime)} - ${formatTime(task.endTime)}</span>
        </div>
        ${task.notes ? `<div class="task-notes">${task.notes}</div>` : ''}
    `;
    
    taskElement.style.backgroundColor = color;
    taskElement.style.color = 'white';
    
    // Add delete functionality
    const deleteBtn = taskElement.querySelector('.delete-task');
    deleteBtn.addEventListener('click', () => {
        tasks = tasks.filter(t => t.id !== task.id);
        updateTaskDisplay();
    });
    
    return taskElement;
}

// Create task element
function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = `task priority-${task.priority}`;
    
    const emoji = settings.priorityEmojis[task.priority];
    const color = settings.priorityColors[task.priority];
    
    taskElement.innerHTML = `
        <div class="task-header">
            <span class="priority-emoji">${emoji}</span>
            <span class="task-text">${task.text}</span>
        </div>
        <div class="task-details">
            <span class="task-category">${task.category || ''}</span>
            <span class="task-time">${formatTime(task.startTime)} - ${formatTime(task.endTime)}</span>
        </div>
        ${task.notes ? `<div class="task-notes">${task.notes}</div>` : ''}
    `;
    
    taskElement.style.backgroundColor = color;
    
    return taskElement;
}

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

// Clear task input fields
function clearTaskInput() {
    taskInput.value = '';
    prioritySelect.value = '1';
    taskCategory.value = '';
    taskStartTime.value = '';
    taskEndTime.value = '';
    taskNotes.value = '';
}

// Reset the day
function resetDay() {
    if (confirm('Are you sure you want to reset the day? This will clear all tasks.')) {
        tasks = [];
        updateTaskDisplay();
    }
}

// Setup event listeners
function setupEventListeners() {
    addTaskBtn.addEventListener('click', addTask);
    settingsBtn.addEventListener('click', () => settingsModal.style.display = 'block');
    resetBtn.addEventListener('click', resetDay);
    startMeditationBtn.addEventListener('click', startMeditation);
    skipMeditationBtn.addEventListener('click', () => welcomeModal.style.display = 'none');
    toggleThemeBtn.addEventListener('click', () => {
        settings.isDarkMode = !settings.isDarkMode;
        saveSettings();
    });
    
    // Save settings when settings modal is closed
    document.getElementById('saveSettings').addEventListener('click', saveSettings);
    
    // Update settings when inputs change
    document.getElementById('blockDuration').addEventListener('change', (e) => {
        settings.blockDuration = parseInt(e.target.value);
    });
    
    document.getElementById('startTime').addEventListener('change', (e) => {
        settings.startTime = e.target.value;
    });
    
    document.getElementById('endTime').addEventListener('change', (e) => {
        settings.endTime = e.target.value;
    });
    
    // Update priority colors and emojis
    for (let i = 1; i <= 3; i++) {
        document.getElementById(`priority${i}Color`).addEventListener('change', (e) => {
            settings.priorityColors[i] = e.target.value;
        });
        
        document.getElementById(`priority${i}Emoji`).addEventListener('change', (e) => {
            settings.priorityEmojis[i] = e.target.value;
        });
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', init); 