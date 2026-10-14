const key='moondust-onboarding-v1';
export function readState(getStorage=()=>localStorage){try{const s=getStorage().getItem(key);return ['later','complete'].includes(s)?s:'new';}catch{return 'new';}}
export function writeState(value,getStorage=()=>localStorage){if(!['later','complete'].includes(value))return;try{getStorage().setItem(key,value);}catch{}}
