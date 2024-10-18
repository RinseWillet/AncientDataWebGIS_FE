import { Link } from 'react-router-dom';

const About = () => {
  return (
    <>
      <main>
        <div className='pagebox'>
          <h1>A website on Roman Roads</h1>
          <blockquote>
            The areas into which Roman hegemony expanded were anything but a tabula rasa and existing settlements and infrastructure facilitated the conquests of these areas and ultimately were expanded upon with provincial organization.
            During the first century BCE, the Romans began building infrastructural projects in north-western Europe and although the Netherlands, with its unique river delta topography, were lacking major Iron Age hillforts, other types of settlement and (wooden) roads already existed. Yet in several phases, roads would be constructed. Furthermore, the rivers Rhine, Meuse, Waal and so on would start to play a vital role in the supply of military bases in the Netherlands and these waterways would be improved.
            Two cities (Voorburg and Nijmegen) emerged in the Netherlands, but while cities have played a significant role in the study of Roman regional settlement systems, small towns, villages and hamlets played a central role in local cultural, commercial, artisanal, and religious life for the majority of the population.
            Therefore, in case (innovation in) infrastructure was to have a real knock-on effect, this is not to be read from the initial uses (which are military), but from the new ideas, goods, practices, and people coming in, in a sustainable way, and from the impact on rural life by changing the structure of and connectivity within local settlement systems.
          </blockquote>

          <br></br>
          <p>
            To explore this, the project aims to first create a reconstruction of the infrastructure and settlements in the area overlapping the Roman provinces of Gallia Belgica and Germania Inferior.
            To this end, the first step is a collection of ancient sources of the Low Countries, Belgium, and Northern France, and North-Western Germany.
            Although ancient sources, varying from Caesar’s Gallic Wars to the Tabula Peutingeriana, do not provide great detail on exact locations, they do give an insight on (the knowledge by the authors of) the existence of and changes in roads, waterways, and settlements.
            The next step is to collect all the archaeological observations on (pre-)Roman settlements and infrastructure, of the same area in general, although a special focus is made on the Eastern Netherlands, as lacunae on the infrastructure are apparent.
            One of the result is this online cartographic repository of the research data.
          </p>
          <br></br>
          <p>
            From these data, the continuity and changes in connectivity and settlement patterns from the Iron Age to the Roman period are explored, in order to identify potential anchors and innovations.
            As the lacunae in knowledge on the road-network and waterways is expected to be significant, geographical analyses and GIS modelling will be employed to reconstruct potential routes of roads that have not been archaeologically attested.
            This also overcomes somewhat the disparities in data(density and quality) for the areas under study.
            Finally, targeted fieldwork is aimed for those areas where settlements and/or roads are likely, either from the study of the archaeological record or from the modelled routes.
            This fieldwork should consist of archaeological prospection using geophysics, although hopefully survey and/or auguring will be part of the research options.
            Combining all these research vistas will start provide an insight in the ways in which changes in habitation and connectivity took place and how these innovations were anchored or deployed on Gallia Belgica and Germania Inferior.
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