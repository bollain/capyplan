import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './routes/Home';
import Room from './routes/Room';
import { ThemeProvider } from './context/ThemeContext';

function App() {
    return (
        <ThemeProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/room/:roomId" element={<Room />} />
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;
