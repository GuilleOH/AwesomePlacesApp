import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { IonicPage, ModalController, LoadingController, ToastController } from 'ionic-angular';
import { SetLocationPage } from '../set-location/set-location';
import { Location } from '../../models/location';
import { Geolocation } from '@ionic-native/geolocation';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { File, Entry, FileError } from '@ionic-native/file';
import { PlacesService } from '../../services/places';
import { Place } from '../../models/place';
import { normalizeURL} from 'ionic-angular';

declare var cordova:any;

@IonicPage()
@Component({
  selector: 'page-add-place',
  templateUrl: 'add-place.html',
})
export class AddPlacePage {

  location: Location = {
    lat: 39.4561165,
    lng: -0.3545661
  };
  locationIsSet: boolean = false;
  imageUrl = '';

  constructor(
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private placesService: PlacesService,
    private geolocation: Geolocation,
    private camera: Camera,
    private file : File
    ) {}

  onSubmit(form: NgForm){
    const newPlace = new Place(form.value.title, form.value.description, this.location, this.imageUrl);
    this.placesService.addPlace(newPlace);
    form.reset();
    this.location = {
      lat: 39.4561165,
      lng: -0.3545661
    };
    this.imageUrl = '';
    this.locationIsSet = false;
  }

  onLocate(){
    const loader = this.loadingCtrl.create({
      content: 'Getting your location...'
    });
    loader.present();
    this.geolocation.getCurrentPosition().then((location) => {
      loader.dismiss();
      this.location.lat = location.coords.latitude;
      this.location.lng = location.coords.longitude;
      this.locationIsSet = true;
    }).catch((error) => {
      loader.dismiss();
      const toast = this.toastCtrl.create({
        message:'Could not get location, please pick it manually!',
        duration:2000
      });
      toast.present();
      console.log('Error getting location', error);
    });
  }

  onOpenMap(){
    const modal = this.modalCtrl.create(SetLocationPage,
      {
      location: this.location,
      isSet: this.locationIsSet
    });
    modal.present();
    modal.onDidDismiss((data)=>{
      if (data){
        this.location = data.location;
        this.locationIsSet = true;
      }
    });
  }



  onTakePhoto(){
    const options: CameraOptions = {
      quality: 50,
      encodingType: this.camera.EncodingType.JPEG,
      correctOrientation:true,
    }
    this.camera.getPicture(options)
    .then((imageData) => {
      const currentName = imageData.replace(/^.*[\\\/]/, '');
      const path = imageData.replace(/[^\/]*$/, '');
      const newFileName = new Date().getUTCMilliseconds() + '.jpg';
      this.file.moveFile(path, currentName, cordova.file.dataDirectory, newFileName)
      .then(
        (data: Entry) =>{
          this.imageUrl = data.nativeURL;
          this.camera.cleanup();
        }
      )
      .catch(
        (err : FileError)=>{
          this.imageUrl = '';
          const toast = this.toastCtrl.create({
            message:'Could not save the image. Please try again',
            duration:2000
          });
          toast.present();
          this.camera.cleanup();
        }
      );
      this.imageUrl = imageData;

    })
    .catch((error) => {
      const toast = this.toastCtrl.create({
        message:'Could not take the image. Please try again',
        duration:2000
      });
      toast.present();
   });
  }

}
