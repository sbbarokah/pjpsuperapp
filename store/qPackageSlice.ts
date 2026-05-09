import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// --- Tipe Data ---
interface QuestionOption {
  teks?: string;
  text?: string;
  poin?: number;
  points?: number;
}

export interface QuestionItem {
  id: string;
  question: string;
  options: QuestionOption[];
  difficulty?: string;
  // Anda bisa menambahkan properti lain jika diperlukan nanti
}

export interface QPackageState {
  cart: QuestionItem[];
}

// --- State Awal ---
const initialState: QPackageState = {
  cart: [],
};

const qPackageSlice = createSlice({
  name: 'qPackage',
  initialState,
  reducers: {
    // Menambahkan 1 soal ke keranjang
    addToCart: (state, action: PayloadAction<QuestionItem>) => {
      // Cek apakah soal sudah ada di keranjang untuk menghindari duplikasi
      const exists = state.cart.find(item => item.id === action.payload.id);
      if (!exists) {
        state.cart.push(action.payload);
      }
    },
    
    // Menghapus 1 soal dari keranjang berdasarkan ID
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.cart = state.cart.filter(item => item.id !== action.payload);
    },
    
    // Toggle (Tambah jika belum ada, Hapus jika sudah ada)
    toggleCartItem: (state, action: PayloadAction<QuestionItem>) => {
      const existsIndex = state.cart.findIndex(item => item.id === action.payload.id);
      if (existsIndex >= 0) {
        // Jika sudah ada, hapus
        state.cart.splice(existsIndex, 1);
      } else {
        // Jika belum ada, tambahkan
        state.cart.push(action.payload);
      }
    },

    // Mengosongkan seluruh isi keranjang
    clearCart: (state) => {
      state.cart = [];
    },
  },
});

export const { addToCart, removeFromCart, toggleCartItem, clearCart } = qPackageSlice.actions;
export default qPackageSlice.reducer;