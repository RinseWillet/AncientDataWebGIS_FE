import {Link} from 'react-router-dom';

const About = () => {
    return (
        <>
        <main>
          <div className='pagebox'>
          <h2>Who are we?</h2>
          <p>
            That feels like an existential question, don't you
            think?
          </p>
          <nav>
          <Link to="/">Home</Link>
        </nav>
          </div>
        </main>
       
        
      </>
    );
  };
  
  export default About;