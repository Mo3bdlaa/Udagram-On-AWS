import express, { Request, Response, request } from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { filterImageFromURL, deleteLocalFiles } from './util/util';

(async () => {

  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;
  
  // Use the body parser middleware for post requests
  app.use(bodyParser.json());

  // @TODO1 IMPLEMENT A RESTFUL ENDPOINT
  // GET /filteredimage?image_url={{URL}}
  // endpoint to filter an image from a public url.
  // IT SHOULD:                                             
  //   1 | validate the image_url query                             
  //   2 | call filterImageFromURL(image_url) to filter the image   
  //   3 | send the resulting file in the response                  
  //   4 | deletes any files on the server on finish of the response
  // QUERY PARAMATERS:
  //    image_url: URL of a publicly accessible image
  // RETURNS:
  //   the filtered image file [!!TIP: res.sendFile(filteredpath); might be useful]
  // END @TODO1

  app.get("/filteredimage", async (req: Request, res: Response) => {

      // create a regex to validate the image_url
      const expression: RegExp = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi;
      const regex: RegExp = new RegExp(expression);

      // Get Image URL from Query
      const image_url: string = (req.query as any).image_url;
      
      // validate if the image_url exists and well formed
      if (!image_url && (!image_url.match(regex))) {
            res.status(400).send({ message: "image url is missing or invalid" });
            return;
      }

      // validate the type of the image
      const url:URL = new URL(image_url);
      const strImageFile: string = path.basename(url.pathname);
      const arrAllowedTypes = [".jpeg",".jpg", ".png", ".bmp", ".tiff"];
      if ( !arrAllowedTypes.includes(path.extname(strImageFile))){
            res.status(400).send({ message: `Type '${path.extname(strImageFile)}' not supported` });
            return;
      }

      const promiseImage: Promise<string> = filterImageFromURL(image_url);

      promiseImage.then(image => {
            res.status(200).sendFile(image, () => {
                  const arrImagesToBeDeleted: Array<string> = new Array(image);
                  deleteLocalFiles(arrImagesToBeDeleted);
            }); 
      }).catch(error => {
            res.status(422).send({ message: `Image not found in provided URL : ${error}` });
            return;
      })

  });

  // Root Endpoint
  // Displays a simple message to the user
  app.get( "/", async ( req, res ) => {
    res.send("try GET /filteredimage?image_url={IMAGE URL}")
  } );
  

  // Start the Server
  app.listen( port, () => {
      console.log( `server running http://localhost:${ port }` );
      console.log( `press CTRL+C to stop server` );
  });

})();