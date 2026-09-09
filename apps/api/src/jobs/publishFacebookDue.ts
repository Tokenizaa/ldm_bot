import { publishDueFacebookPosts } from '../services/facebookGroupPlannerService.js';

const limit = Number.parseInt(process.env.FACEBOOK_PUBLISH_BATCH_SIZE ?? '5', 10);

publishDueFacebookPosts(Number.isFinite(limit) ? limit : 5)
  .then((result) => {
    console.log(JSON.stringify({ job: 'publish-facebook-due', ...result }));
    if (result.failed > 0) process.exitCode = 1;
  })
  .catch((error) => {
    console.error(JSON.stringify({ job: 'publish-facebook-due', error: error instanceof Error ? error.message : String(error) }));
    process.exitCode = 1;
  });
