/* eslint-disable @typescript-eslint/no-namespace */
import { Test, TestingModule } from '@nestjs/testing';
import { S3UploadRepository } from './api-s3-upload-repository-data-access';
import { PrismaService } from "@aerial-mapping/api/shared/services/prisma/data-access";

describe('S3UploadRepository', () => {
  let repository: S3UploadRepository;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [S3UploadRepository, PrismaService]
    }).compile();

    repository = module.get<S3UploadRepository>(S3UploadRepository);
  });

  it('Should be defined', async () => {
    expect(repository).toBeDefined();
  });

  describe('@S3Upload', () => {
    it('should return "Success!"', async () => {
      jest
        .spyOn(repository, 'S3Upload')
        .mockImplementation(() => Promise.resolve('Success!'));

      expect(await repository.S3Upload(1, "ImageName", "dylpickles-image-bucket/test.jpg")).toBe("Success!")
    })
  });

  describe('@S3Download', () => {
    it('should return a path', async () => {
      jest
        .spyOn(repository, 'S3Upload')
        .mockImplementation(() => Promise.resolve('dylpickles-image-bucket/test.jpg'));

      expect(await repository.S3Upload(1, "ImageName", "dylpickles-image-bucket/test.jpg")).toBe("dylpickles-image-bucket/test.jpg")
    });
  });

  describe('@createImageCollection', () => {
    it('should return "Created Image Collection!"', async () => {
      jest
        .spyOn(repository, 'createImageCollection')
        .mockImplementation(() => Promise.resolve("Created Image Collection!"));

      expect(await repository.createImageCollection(1, "CollectionName", new Date().toISOString(), true, 1)).toBe("Created Image Collection!")
    })
  });

  describe('@createImageCollection', () => {
    it('should return "Created Image Collection!"', async () => {
      jest
        .spyOn(repository, 'createImageCollection')
        .mockImplementation(() => Promise.resolve("There is a foreign key constraint violation"));

      expect(await repository.createImageCollection(-1, "", "-1", false, 2121212)).toBe("There is a foreign key constraint violation")
    })
  });

});
