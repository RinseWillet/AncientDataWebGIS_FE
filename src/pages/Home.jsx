import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <>
      <div className='pagebox'>
        <main>
          <h2>Welcome to the homepage!</h2>
          <p>You can do this, I believe in you.</p>
        </main>
        <nav>
          <Link to="/about">About</Link>
          <Link to="/atlas">Atlas</Link>
        </nav>
      </div>
    </>
  );
};

export default Home;