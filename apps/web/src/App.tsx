import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './routes/Home';
import Room from './routes/Room';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/room/:roomId" element={<Room />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
