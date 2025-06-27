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
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
      padding: '20px', 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' ,
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Main Container */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '20px', 
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)', 
          overflow: 'hidden' 
        }}>
          
          {/* Header */}
          <div style={{ 
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', 
            padding: '40px 30px', 
            textAlign: 'center', 
            color: 'white' 
          }}>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 'bold', 
              margin: '0 0 10px 0' 
            }}>
              🔗 Decentralized To-Do List
            </h1>
            <p style={{ 
              fontSize: '1.1rem', 
              opacity: '0.9', 
              margin: '0' 
            }}>
              Manage your tasks on the blockchain
            </p>
          </div>

          {/* Connection Status */}
          <div style={{ padding: '25px 30px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            {account ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                backgroundColor: '#dcfce7', 
                border: '1px solid #bbf7d0', 
                borderRadius: '12px', 
                padding: '15px 20px' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    backgroundColor: '#22c55e', 
                    borderRadius: '50%', 
                    marginRight: '12px',
                    animation: 'pulse 2s infinite'
                  }}></div>
                  <span style={{ 
                    color: '#166534', 
                    fontWeight: '600', 
                    fontSize: '1rem' 
                  }}>
                    ✅ Connected to MetaMask
                  </span>
                </div>
                <span style={{ 
                  color: '#059669', 
                  fontFamily: 'monospace', 
                  fontSize: '0.9rem', 
                  backgroundColor: '#a7f3d0', 
                  padding: '6px 12px', 
                  borderRadius: '20px',
                  fontWeight: '500'
                }}>
                  {account.substring(0, 6)}...{account.slice(-4)}
                </span>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={initWeb3}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '15px 30px',
                    borderRadius: '12px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  🦊 Connect MetaMask Wallet
                </button>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div style={{ 
              margin: '20px 30px 0', 
              padding: '20px', 
              backgroundColor: '#fef2f2', 
              border: '1px solid #fecaca', 
              borderRadius: '12px',
              borderLeft: '4px solid #ef4444'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.5rem', marginRight: '12px' }}>⚠️</span>
                <div>
                  <h4 style={{ 
                    color: '#dc2626', 
                    fontWeight: '600', 
                    margin: '0 0 8px 0',
                    fontSize: '1rem'
                  }}>
                    Error
                  </h4>
                  <p style={{ 
                    color: '#b91c1c', 
                    margin: '0',
                    fontSize: '0.9rem',
                    lineHeight: '1.5'
                  }}>
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Add Task Form */}
          <div style={{ 
            padding: '30px', 
            backgroundColor: 'white', 
            borderBottom: '1px solid #e2e8f0' 
          }}>
            <div style={{ display: 'flex', gap: '15px' }}>
              <input
                type="text"
                value={newTaskContent}
                onChange={(e) => setNewTaskContent(e.target.value)}
                placeholder="What needs to be done? ✨"
                style={{
                  flex: '1',
                  padding: '15px 20px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  backgroundColor: !account || loading ? '#f1f5f9' : 'white',
                  color: 'black'
                }}
                disabled={!account || loading}
                onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                onKeyPress={(e) => e.key === 'Enter' && createTask()}
              />
              <button
                onClick={createTask}
                disabled={!account || loading || !newTaskContent.trim()}
                style={{
                  background: !account || loading || !newTaskContent.trim() 
                    ? '#9ca3af' 
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '15px 25px',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: !account || loading || !newTaskContent.trim() ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '140px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.3)';
                  }
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                {loading && newTaskContent.trim() ? (
                  <>
                    <span style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></span>
                    Adding...
                  </>
                ) : (
                  <>➕ Add Task</>
                )}
              </button>
            </div>
          </div>

          {/* Tasks List */}
          <div style={{ padding: '30px' }}>
            {loading && tasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid #e2e8f0',
                  borderTop: '4px solid #4f46e5',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 20px'
                }}></div>
                <p style={{ 
                  color: '#64748b', 
                  fontSize: '1.1rem',
                  margin: '0'
                }}>
                  Loading your tasks...
                </p>
              </div>
            ) : tasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📝</div>
                <h3 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '600', 
                  color: '#1f2937', 
                  margin: '0 0 12px 0' 
                }}>
                  No tasks yet
                </h3>
                <p style={{ 
                  color: '#6b7280', 
                  fontSize: '1.1rem',
                  margin: '0',
                  lineHeight: '1.6'
                }}>
                  {account 
                    ? "Ready to add your first blockchain task? ✨" 
                    : "Connect your MetaMask wallet to start managing tasks on the blockchain! 🚀"
                  }
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {tasks.map((task, index) => (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '2px solid ' + (task.completed ? '#bbf7d0' : '#e2e8f0'),
                      backgroundColor: task.completed ? '#f0fdf4' : '#ffffff',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      animationDelay: `${index * 100}ms`,
                      animation: 'slideInUp 0.5s ease-out forwards'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleCompleted(task.id)}
                      disabled={!account || loading}
                      style={{
                        width: '24px',
                        height: '24px',
                        marginRight: '20px',
                        cursor: !account || loading ? 'not-allowed' : 'pointer',
                        accentColor: '#10b981'
                      }}
                    />
                    <span
                      style={{
                        flex: '1',
                        fontSize: '1.1rem',
                        lineHeight: '1.5',
                        textDecoration: task.completed ? 'line-through' : 'none',
                        color: task.completed ? '#059669' : '#1f2937',
                        fontWeight: task.completed ? '500' : '400',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {task.content}
                    </span>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        backgroundColor: task.completed ? '#dcfce7' : '#fef3c7',
                        color: task.completed ? '#166534' : '#92400e',
                        border: '1px solid ' + (task.completed ? '#bbf7d0' : '#fde68a')
                      }}
                    >
                      {task.completed ? '✅ Completed' : '⏳ Pending'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ 
            backgroundColor: '#f8fafc', 
            padding: '25px 30px', 
            textAlign: 'center', 
            borderTop: '1px solid #e2e8f0' 
          }}>
            <p style={{ 
              color: '#64748b', 
              margin: '0 0 8px 0',
              fontSize: '1rem',
              fontWeight: '500'
            }}>
              🔗 Powered by Ethereum Smart Contracts
            </p>
            <p style={{ 
              color: '#94a3b8', 
              fontSize: '0.9rem',
              fontFamily: 'monospace',
              margin: '0'
            }}>
              Contract: {CONTRACT_ADDRESS.substring(0, 10)}...{CONTRACT_ADDRESS.slice(-8)}
            </p>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `
      }} />
    </div>
  );
}

export default App;