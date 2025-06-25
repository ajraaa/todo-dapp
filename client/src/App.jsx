import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers'; // Import ethers
import TodoListABI from './contracts/TodoList.json'; // Import ABI

// Alamat Kontrakmu (Ganti dengan alamat setelah deployment!)
// Saat kamu mendeploy dengan `npx hardhat run scripts/deploy.js` ke Hardhat Network lokal,
// alamatnya akan ditampilkan di konsol. Salin dan tempel di sini.
// Contoh: const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // GANTI INI!

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTaskContent, setNewTaskContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fungsi untuk menginisialisasi Web3 (MetaMask) dan kontrak
  const initWeb3 = async () => {
    try {
      // Periksa apakah MetaMask terinstal
      if (window.ethereum) {
        // Menggunakan ethers.js untuk berinteraksi dengan MetaMask
        const ethProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(ethProvider);

        // Meminta akses ke akun pengguna
        const accounts = await ethProvider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);

        // Dapatkan signer (untuk mengirim transaksi)
        const ethSigner = await ethProvider.getSigner();
        setSigner(ethSigner);

        // Inisialisasi kontrak
        const todoContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          TodoListABI.abi, // Ambil bagian 'abi' dari JSON
          ethSigner // Gunakan signer untuk menulis transaksi
        );
        setContract(todoContract);

        // Dengarkan perubahan akun MetaMask
        window.ethereum.on('accountsChanged', (newAccounts) => {
          if (newAccounts.length > 0) {
            setAccount(newAccounts[0]);
            // Re-initialize signer dan contract jika akun berubah
            ethProvider.getSigner().then(s => {
                setSigner(s);
                setContract(new ethers.Contract(CONTRACT_ADDRESS, TodoListABI.abi, s));
            });
          } else {
            setAccount(null);
            setSigner(null);
            setContract(null);
          }
        });

        // Dengarkan perubahan chain/network
        window.ethereum.on('chainChanged', () => {
          window.location.reload(); // Reload halaman jika network berubah
        });

      } else {
        setError('MetaMask is not installed. Please install it to use this DApp.');
      }
    } catch (err) {
      console.error("Error initializing Web3:", err);
      setError(`Failed to connect to MetaMask. ${err.message}`);
    }
  };

  // Fungsi untuk mengambil semua tugas dari kontrak
  const fetchTasks = async () => {
    if (!contract) return;
    setLoading(true);
    setError('');
    try {
      const taskCount = await contract.taskCount();
      const loadedTasks = [];
      for (let i = 1; i <= taskCount; i++) {
        const task = await contract.tasks(i); // Memanggil getter public `tasks`
        loadedTasks.push({
          id: Number(task.id), // Konversi BigInt ke Number
          content: task.content,
          completed: task.completed,
        });
      }
      setTasks(loadedTasks);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError(`Failed to fetch tasks. ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk menambahkan tugas baru
  const createTask = async () => {
    if (!contract || !newTaskContent.trim()) {
      setError('Please connect to MetaMask and enter a task.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const tx = await contract.createTask(newTaskContent);
      await tx.wait(); // Tunggu transaksi dikonfirmasi
      setNewTaskContent(''); // Bersihkan input
      await fetchTasks(); // Muat ulang daftar tugas
    } catch (err) {
      console.error("Error creating task:", err);
      setError(`Failed to create task. ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk mengubah status selesai tugas
  const toggleCompleted = async (id) => {
    if (!contract) return;
    setLoading(true);
    setError('');
    try {
      const tx = await contract.toggleCompleted(id);
      await tx.wait(); // Tunggu transaksi dikonfirmasi
      await fetchTasks(); // Muat ulang daftar tugas
    } catch (err) {
      console.error("Error toggling task completion:", err);
      setError(`Failed to toggle task. ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Efek samping: Jalankan initWeb3 sekali saat komponen dimuat
  useEffect(() => {
    initWeb3();
  }, []);

  // Efek samping: Ambil tugas setiap kali kontrak atau akun berubah
  useEffect(() => {
    if (contract && account) {
      fetchTasks();
    }
  }, [contract, account]);

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', fontFamily: 'Arial, sans-serif', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>Decentralized To-Do List</h1>
      {error && <p style={{ color: 'red', textAlign: 'center', backgroundColor: '#ffe6e6', padding: '10px', borderRadius: '4px' }}>Error: {error}</p>}

      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        {account ? (
          <p style={{ color: '#007bff', fontWeight: 'bold' }}>Connected Account: {account.substring(0, 6)}...{account.slice(-4)}</p>
        ) : (
          <button
            onClick={initWeb3}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Connect MetaMask
          </button>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={newTaskContent}
          onChange={(e) => setNewTaskContent(e.target.value)}
          placeholder="Add a new task..."
          style={{
            width: 'calc(100% - 100px)',
            padding: '10px',
            marginRight: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '16px'
          }}
          disabled={!account || loading}
        />
        <button
          onClick={createTask}
          disabled={!account || loading || !newTaskContent.trim()}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            padding: '10px 15px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          {loading && newTaskContent.trim() ? 'Adding...' : 'Add Task'}
        </button>
      </div>

      {loading && tasks.length === 0 && <p style={{ textAlign: 'center', color: '#555' }}>Loading tasks...</p>}

      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {tasks.map((task) => (
          <li
            key={task.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px',
              borderBottom: '1px solid #eee',
              backgroundColor: task.completed ? '#f0f8ff' : 'white'
            }}
          >
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleCompleted(task.id)}
              style={{ marginRight: '10px', transform: 'scale(1.2)' }}
              disabled={!account || loading}
            />
            <span
              style={{
                flexGrow: 1,
                textDecoration: task.completed ? 'line-through' : 'none',
                color: task.completed ? '#888' : '#333',
                fontSize: '18px'
              }}
            >
              {task.content}
            </span>
          </li>
        ))}
        {tasks.length === 0 && !loading && account && (
            <p style={{ textAlign: 'center', color: '#555' }}>No tasks found. Add a new one!</p>
        )}
        {tasks.length === 0 && !loading && !account && (
            <p style={{ textAlign: 'center', color: '#555' }}>Connect your MetaMask wallet to see and add tasks.</p>
        )}
      </ul>
    </div>
  );
}

export default App;