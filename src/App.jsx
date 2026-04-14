import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import Editor from "@monaco-editor/react";
import { Play, CheckCircle, Circle, BookOpen, Terminal, Code2, Users, Lightbulb, Save, Plus, Trash2 } from "lucide-react";
import STUDENTS_DATA from "./data/students.json";
import "./App.css";

const MODULES = [
  { id: 0, title: "Identitas Siswa", type: "intro" },
  { id: 1, title: "Pengenalan & Variabel", type: "lesson" },
  { id: 2, title: "Tipe Data Dasar", type: "lesson" },
  { id: 3, title: "Pengkondisian (If/Else)", type: "lesson" },
  { id: 4, title: "Perulangan (Looping)", type: "lesson" },
  { id: 5, title: "Refleksi Akhir", type: "outro" },
];

const CLASSES = [...new Set(STUDENTS_DATA.map(s => s.class))].sort();

const DEFAULT_CODE = `#include <iostream>
using namespace std;

int main() {
    // Tulis kodemu di bawah ini
    cout << "Halo Dunia!" << endl;

    return 0;
}
`;

function App() {
  const [activeModule, setActiveModule] = useState(0);
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState("Menunggu eksekusi...");
  const [isRunning, setIsRunning] = useState(false);

  // Data State for LKPD (JSON Structure)
  const [studentData, setStudentData] = useState({
    groupName: "",
    class: "",
    members: [""] // Array of strings untuk JSON
  });
  const [reflection, setReflection] = useState("");
  const [saved, setSaved] = useState(false);

  // --- MEMBER HANDLING ---
  const handleAddMember = () => {
    setStudentData({
      ...studentData,
      members: [...studentData.members, ""]
    });
  };

  const handleRemoveMember = (index) => {
    // Sisakan minimal 1 anggota
    if (studentData.members.length > 1) {
      const newMembers = studentData.members.filter((_, i) => i !== index);
      setStudentData({ ...studentData, members: newMembers });
    }
  };

  const handleUpdateMember = (index, value) => {
    const newMembers = [...studentData.members];
    newMembers[index] = value;
    setStudentData({ ...studentData, members: newMembers });
  };
  // -------------------------

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput("Memproses kompilasi C++...");

    try {
      // Pengecekan aman apakah berjalan di dalam environment Tauri (desktop) atau sekadar browser biasa.
      if (window.__TAURI_INTERNALS__) {
        const result = await invoke("execute_cpp", { code });
        setOutput(`> Kompilasi Berhasil!\n> \n${result}\n> \n> Program exited with code 0`);
      } else {
        // Mode fallback jika diakses via browser standar (misal Chrome / localhost)
        setTimeout(() => {
          setOutput(`[MOCK MODE - Browser Biasa]\n> Tauri backend (mesin kompilasi Rust) tidak terdeteksi di browser ini.\n> Silakan build aplikasi ke bentuk desktop (.exe/.AppImage) untuk mengeksekusi C++ aslinya.\n> \n> (Simulasi Output):\n> Halo Dunia!\n> \n> Program exited with code 0`);
          setIsRunning(false);
        }, 1500);
        return;
      }
    } catch (error) {
      setOutput(`${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSaveData = (e) => {
    e.preventDefault();
    setSaved(true);

    // Disini data studentData (berformat JSON) siap dikirim ke backend / database jika ada nantinya.
    console.log("Data Siswa Disimpan (JSON): ", JSON.stringify(studentData, null, 2));

    setTimeout(() => setSaved(false), 2000);
  };

  // Helper to get active module data
  const currentMod = MODULES.find(m => m.id === activeModule);

  return (
    <div className="flex h-screen w-screen bg-[#0E1117] text-slate-300 font-sans overflow-hidden">
      {/* 1. SIDEBAR (15%) */}
      <aside className="w-64 bg-[#161B22] border-r border-slate-800 flex flex-col">
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Code2 size={24} />
          </div>
          <div>
            <h1 className="font-bold text-slate-100 leading-tight text-sm">LKPJ C++</h1>
            <p className="text-xs text-slate-500">{studentData.groupName || "Lembar Kerja Siswa"}</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {MODULES.map((mod) => (
              <li key={mod.id}>
                <button
                  onClick={() => setActiveModule(mod.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors
                    ${activeModule === mod.id
                      ? "bg-blue-500/10 text-blue-400 font-medium"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"}`
                  }
                >
                  {mod.type === 'intro' ? (
                    <Users size={16} className={activeModule === mod.id ? "text-blue-500" : "text-slate-500"} />
                  ) : mod.type === 'outro' ? (
                    <Lightbulb size={16} className={activeModule === mod.id ? "text-yellow-500" : "text-slate-500"} />
                  ) : (
                    <Circle size={16} className="text-slate-600" />
                  )}
                  <span className="text-left flex-1">{mod.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* CONDITIONAL RENDERING BASED ON MODULE TYPE */}

      {currentMod.type === 'intro' && (
        <section className="flex-1 flex items-center justify-center bg-[#0A0D12] p-8 overflow-y-auto">
          <form onSubmit={handleSaveData} className="max-w-xl w-full bg-[#161B22] border border-slate-800 p-8 rounded-xl shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Users className="text-blue-500" /> Identitas Kelompok
            </h2>
            <p className="text-slate-400 mb-8 border-b border-slate-800 pb-4">Silakan lengkapi data anggota kelompok sebelum memulai latihan C++.</p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nama Kelompok</label>
                <input
                  type="text"
                  required
                  value={studentData.groupName}
                  onChange={(e) => setStudentData({ ...studentData, groupName: e.target.value })}
                  className="w-full bg-[#0D1117] border border-slate-700 rounded-md px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Misal: Kelompok Alpha"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Kelas</label>
                <select
                  required
                  value={studentData.class}
                  onChange={(e) => {
                    const newClass = e.target.value;
                    // Reset anggota kalau kelas ganti
                    setStudentData({ ...studentData, class: newClass, members: [""] });
                  }}
                  className="w-full bg-[#0D1117] border border-slate-700 rounded-md px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none"
                >
                  <option value="" disabled>-- Pilih Kelas --</option>
                  {CLASSES.map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Anggota Kelompok</label>
                <div className="space-y-2">
                  {studentData.members.map((memberNIS, idx) => {
                    const availableStudents = STUDENTS_DATA.filter(s => s.class === studentData.class);

                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="bg-[#0D1117] border border-slate-700 rounded-md px-3 py-2.5 text-slate-500 text-sm">
                          {idx + 1}
                        </div>
                        <select
                          required
                          value={memberNIS}
                          onChange={(e) => handleUpdateMember(idx, e.target.value)}
                          disabled={!studentData.class}
                          className="flex-1 bg-[#0D1117] border border-slate-700 rounded-md px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none disabled:opacity-50"
                        >
                          <option value="" disabled>-- Pilih Siswa --</option>
                          {availableStudents.map(student => (
                            <option key={student.nis} value={student.nis}>
                              {student.nis} - {student.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(idx)}
                          disabled={studentData.members.length === 1}
                          className="p-3 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                          title="Hapus Anggota"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleAddMember}
                  disabled={!studentData.class}
                  className="mt-3 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-3 py-1.5 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Plus size={16} /> Tambah Anggota
                </button>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
              <span className="text-green-400 text-sm font-medium">{saved ? "✅ Data tersimpan di memori!" : ""}</span>
              <button type="submit" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-md font-medium transition-colors">
                <Save size={18} /> Simpan
              </button>
            </div>
          </form>
        </section>
      )}

      {currentMod.type === 'outro' && (
        <section className="flex-1 flex items-center justify-center bg-[#0A0D12] p-8 overflow-y-auto">
          <form onSubmit={handleSaveData} className="max-w-2xl w-full bg-[#161B22] border border-slate-800 p-8 rounded-xl shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Lightbulb className="text-yellow-500" /> Refleksi Akhir
            </h2>
            <p className="text-slate-400 mb-8 border-b border-slate-800 pb-4">Wah, selamat! Kalian telah menyelesaikan semua materi LKPJ C++ hari ini.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  1. Apa hal baru yang kalian pelajari hari ini?
                </label>
                <textarea
                  rows="4"
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  className="w-full bg-[#0D1117] border border-slate-700 rounded-md px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                  placeholder="Ketik refleksi kalian di sini..."
                ></textarea>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
              <span className="text-green-400 text-sm font-medium">{saved ? "✅ Refleksi berhasil disimpan!" : ""}</span>
              <button type="submit" className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-md font-medium transition-colors shadow-lg shadow-green-900/20">
                <CheckCircle size={18} /> Selesaikan LKPJ
              </button>
            </div>
          </form>
        </section>
      )}

      {currentMod.type === 'lesson' && (
        <>
          {/* 2. AREA MATERI (40%) */}
          <section className="flex-[4] flex flex-col border-r border-slate-800 bg-[#0A0D12]">
            <div className="h-12 border-b border-slate-800 flex items-center px-4 gap-2 text-sm font-medium text-slate-400">
              <BookOpen size={16} /> Materi Pelajaran
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold text-white mb-2">{currentMod.title}</h2>
                <div className="prose prose-invert prose-blue max-w-none">
                  <p className="text-slate-300 leading-relaxed text-lg mb-6 mt-4">
                    Selamat datang di materi {currentMod.title}. Bacalah instruksi di lembar ini dengan saksama dan berdiskusilah dengan teman kelompokmu.
                  </p>

                  <h3 className="text-xl font-semibold text-white mt-8 mb-3">Penjelasan Konsep</h3>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    Konsep dasar ini penting agar kita memahami alur kerja bahasa mesin. Di C++, setiap perintah yang diketik secara langsung dikompilasi (diterjemahkan) oleh mesin.
                  </p>

                  <div className="bg-[#1C212B] rounded-lg p-5 border border-slate-800 my-6 shadow-lg">
                    <h4 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                      <span className="bg-blue-500/20 text-blue-400 p-1 rounded">🎯</span> Tantangan!
                    </h4>
                    <p className="text-sm text-slate-300">
                      Coba uji pemahamanmu dengan mengetikkan solusi pada editor di kanan. Setelah yakin, klik tombol Run Code!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 3. CODE EDITOR & CONSOLE (45%) */}
          <section className="flex-[4.5] flex flex-col h-full">
            {/* Header Editor */}
            <div className="h-12 border-b border-slate-800 bg-[#161B22] flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="ml-3 text-sm text-slate-400 font-mono">main.cpp</span>
              </div>
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className={`flex items-center gap-2 px-4 py-1.5 rounded bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-all shadow-lg shadow-green-900/20
                  ${isRunning ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <Play size={16} className={isRunning ? "animate-pulse" : ""} fill="currentColor" />
                {isRunning ? "Running..." : "Run Code"}
              </button>
            </div>

            {/* Monaco Editor (Upper Half) */}
            <div className="flex-[6] bg-[#1E1E1E] relative border-b border-black">
              <Editor
                height="100%"
                defaultLanguage="cpp"
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  padding: { top: 16 },
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                }}
              />
            </div>

            {/* Output Console (Lower Half) */}
            <div className="flex-[4] flex flex-col bg-[#0D1117]">
              <div className="h-10 bg-[#161B22] border-b border-slate-800 flex items-center px-4 gap-2 text-sm font-medium text-slate-400">
                <Terminal size={16} /> Console Output
              </div>
              <div className="flex-1 p-4 overflow-y-auto font-mono text-sm">
                <pre className={output.includes("error") ? "text-red-400" : "text-green-400"}>
                  {output}
                </pre>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default App;
